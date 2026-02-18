import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { userApi } from "@/api/axios";
import { useLocationStore, SavedAddress } from "@/store/useLocationStore";
import { Loader2, MapPin, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Fix Leaflet default marker icons broken in bundlers
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLat?: number;
    initialLng?: number;
    onConfirm?: (address: any) => void;
    saveAddress?: boolean;
}

export function LocationPickerModal({
    isOpen,
    onClose,
    initialLat,
    initialLng,
    onConfirm,
    saveAddress = true,
}: LocationPickerModalProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const [resolvedAddress, setResolvedAddress] = useState<any>(null);
    const [geocoding, setGeocoding] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const { setSelectedAddress } = useLocationStore();

    const doReverseGeocode = async (lat: number, lng: number) => {
        setGeocoding(true);
        try {
            const res = await userApi.reverseGeocode(lat, lng);
            setResolvedAddress({ ...res.data, coordinates: { lat, lng } });
        } catch {
            // Fallback to Nominatim
            try {
                const r = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                );
                const data = await r.json();
                const addr = data.address || {};
                setResolvedAddress({
                    addressLine1: [addr.road, addr.suburb].filter(Boolean).join(", ") || data.display_name?.split(",")[0],
                    addressLine2: addr.neighbourhood || "",
                    city: addr.city || addr.town || addr.village || "",
                    state: addr.state || "",
                    postalCode: addr.postcode || "",
                    displayName: data.display_name?.split(",").slice(0, 3).join(", "),
                    coordinates: { lat, lng },
                });
            } catch {
                toast.error("Could not resolve address");
            }
        } finally {
            setGeocoding(false);
        }
    };

    // Initialize map when modal opens
    useEffect(() => {
        if (!isOpen) return;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            // Destroy existing map instance if any
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
                markerRef.current = null;
            }

            const defaultLat = initialLat ?? 22.5726;
            const defaultLng = initialLng ?? 88.3639;

            const map = L.map(mapRef.current, {
                center: [defaultLat, defaultLng],
                zoom: 16,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

            marker.on("dragend", () => {
                const { lat, lng } = marker.getLatLng();
                doReverseGeocode(lat, lng);
            });

            map.on("click", (e: L.LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                doReverseGeocode(lat, lng);
            });

            leafletMapRef.current = map;
            markerRef.current = marker;

            // Try browser geolocation if no initial coords
            if (!initialLat && !initialLng) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        map.setView([latitude, longitude], 16);
                        marker.setLatLng([latitude, longitude]);
                        doReverseGeocode(latitude, longitude);
                    },
                    () => {
                        doReverseGeocode(defaultLat, defaultLng);
                    },
                    { timeout: 8000 }
                );
            } else {
                doReverseGeocode(defaultLat, defaultLng);
            }

            // Fix map tile rendering after modal animation
            setTimeout(() => map.invalidateSize(), 300);
        }, 100);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    const handleConfirm = async () => {
        if (!resolvedAddress) return;
        setConfirming(true);

        if (!saveAddress) {
            const loc = {
                type: "OTHER",
                addressLine1: resolvedAddress.addressLine1 || resolvedAddress.displayName || "My Location",
                addressLine2: resolvedAddress.addressLine2 || "",
                city: resolvedAddress.city || "",
                state: resolvedAddress.state || "",
                postalCode: resolvedAddress.postalCode || "",
                coordinates: resolvedAddress.coordinates,
            };
            if (onConfirm) onConfirm(loc);
            onClose();
            setConfirming(false);
            return;
        }

        try {
            const payload = {
                type: "OTHER",
                addressLine1: resolvedAddress.addressLine1 || resolvedAddress.displayName || "My Location",
                addressLine2: resolvedAddress.addressLine2 || "",
                city: resolvedAddress.city || "",
                state: resolvedAddress.state || "",
                postalCode: resolvedAddress.postalCode || "",
                mobile: "",
                coordinates: resolvedAddress.coordinates,
            };
            const res = await userApi.addAddress(payload);
            const responseData = res.data;
            // Extract real ID, do NOT fallback to Date.now() for API calls
            const realId = responseData?._id || responseData?.id || responseData?.address?._id || responseData?.address?.id;

            // For UI state, we can use a fallback if needed, but preferably not for the API
            const saved: SavedAddress = {
                ...payload,
                _id: realId || String(Date.now()),
                type: "OTHER",
            };

            // PER USER REQUEST: Auto-select and persist to backend immediately
            // Only call select API if we have a valid real ID
            if (realId) {
                try {
                    await userApi.selectAddress({ addressId: realId });
                    toast.success("Location confirmed & selected!");
                } catch (err) {
                    console.error("Failed to auto-select new address:", err);
                    // Don't error out completely, just warn
                }
            } else {
                console.warn("Could not extract real ID, skipping auto-select API. Response:", responseData);
                toast.success("Location added (Visual only)");
            }

            setSelectedAddress(saved);
            if (onConfirm) onConfirm(saved);

            onClose();
        } catch {
            // Even if save fails, use it as selected
            const fallback: SavedAddress = {
                _id: String(Date.now()),
                type: "OTHER",
                addressLine1: resolvedAddress.addressLine1 || resolvedAddress.displayName || "My Location",
                addressLine2: resolvedAddress.addressLine2 || "",
                city: resolvedAddress.city || "",
                state: resolvedAddress.state || "",
                postalCode: resolvedAddress.postalCode || "",
                coordinates: resolvedAddress.coordinates,
            };
            setSelectedAddress(fallback);
            if (onConfirm) onConfirm(fallback);
            onClose();
        } finally {
            setConfirming(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col bg-background"
                >
                    {/* Top Bar */}
                    <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
                        >
                            <X className="h-5 w-5 text-foreground" />
                        </button>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Set Delivery Location</h2>
                            <p className="text-xs text-muted-foreground">Drag the pin or tap the map to pick your spot</p>
                        </div>
                    </div>

                    {/* Map Container — vanilla Leaflet mounts here */}
                    <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

                    {/* Bottom Address Card */}
                    <motion.div
                        initial={{ y: 80 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-shrink-0 border-t border-border bg-card px-5 pb-8 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {geocoding ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                        <span className="text-sm">Finding your address...</span>
                                    </div>
                                ) : resolvedAddress ? (
                                    <>
                                        <p className="font-bold text-foreground leading-snug truncate">
                                            {resolvedAddress.displayName ||
                                                [resolvedAddress.addressLine1, resolvedAddress.addressLine2]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                        </p>
                                        <p className="mt-0.5 text-sm text-muted-foreground truncate">
                                            {[resolvedAddress.city, resolvedAddress.state, resolvedAddress.postalCode]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Move the map to select your location</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!resolvedAddress || geocoding || confirming}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-60"
                        >
                            {confirming ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <CheckCircle className="h-5 w-5" />
                            )}
                            Confirm Location
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
