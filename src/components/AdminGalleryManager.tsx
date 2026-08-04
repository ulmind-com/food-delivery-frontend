import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantApi, uploadApi } from "@/api/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  ZoomIn,
  Images,
} from "lucide-react";

export default function AdminGalleryManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current gallery images
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: () =>
      restaurantApi.getGallery().then((r) => r.data.images as string[]),
  });

  const images = galleryData || [];

  // Mutations
  const addMutation = useMutation({
    mutationFn: (data: { urls: string[] }) =>
      restaurantApi.addGalleryImages(data),
    onSuccess: () => {
      toast.success("Images uploaded to gallery! 🎉");
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to add image"),
  });

  const deleteMutation = useMutation({
    mutationFn: (index: number) => restaurantApi.deleteGalleryImage(index),
    onSuccess: () => {
      toast.success("Image removed");
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to delete"),
  });

  const reorderMutation = useMutation({
    mutationFn: (newOrder: string[]) =>
      restaurantApi.reorderGallery({ images: newOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
    onError: () => toast.error("Failed to reorder"),
  });

  // Move image up/down
  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [
      newImages[target],
      newImages[index],
    ];
    reorderMutation.mutate(newImages);
  };

  // Handle multi-file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 20 - images.length;
    if (files.length > remainingSlots) {
      toast.error(
        `Only ${remainingSlots} more images can be added (max 20 total)`
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadApi.uploadImage(files[i]);
        if (res.data.url) {
          uploadedUrls.push(res.data.url);
        }
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (uploadedUrls.length > 0) {
        addMutation.mutate({ urls: uploadedUrls });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl flex items-center gap-3 font-bold tracking-tight text-foreground">
            <Images className="h-8 w-8 text-primary" />
            Gallery Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload photos for your home page gallery. Max 20 images. These
            appear in the "Our Moments" section.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground px-3 py-1.5 rounded-full bg-muted">
            {images.length} / 20
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= 20}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {uploading ? `Uploading ${uploadProgress}%` : "Add Photos"}
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="rounded-xl bg-muted/50 p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Uploading images...
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <label className="flex flex-col items-center justify-center p-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all">
          <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">
            No gallery images yet. Click to upload!
          </p>
          <p className="text-sm mt-1 text-muted-foreground/60">
            Supports JPG, PNG, WebP
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((src, i) => (
            <motion.div
              key={`${src}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
              className="group relative aspect-square bg-muted rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all hover:border-primary/40"
            >
              <img
                src={src}
                alt={`Gallery ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Position badge */}
              <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-[11px] font-bold text-white backdrop-blur-sm">
                {i + 1}
              </span>

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-3">
                <div className="flex gap-2 w-full">
                  {/* Move Up */}
                  <button
                    onClick={() => moveImage(i, "up")}
                    disabled={i === 0}
                    className="flex-1 py-2 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  {/* Preview */}
                  <button
                    onClick={() => setLightbox(src)}
                    className="flex-1 py-2 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center"
                    title="Preview"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => moveImage(i, "down")}
                    disabled={i === images.length - 1}
                    className="flex-1 py-2 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm("Delete this image from gallery?"))
                        deleteMutation.mutate(i);
                    }}
                    className="py-2 px-3 rounded-lg bg-red-500/90 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add More — always at the end */}
          {images.length < 20 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Upload className="h-8 w-8 mb-2 opacity-60" />
                  <span className="text-xs font-bold">Add More</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setLightbox(null)}
              aria-label="Close image"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              src={lightbox}
              alt="Gallery preview"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[92vw] rounded-[20px] object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
