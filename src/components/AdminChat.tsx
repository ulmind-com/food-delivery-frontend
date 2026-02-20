import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/axios";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
    MessageSquare, Send, CheckCheck, Circle,
    Trash2, XCircle, RefreshCw, Users, Inbox, AlertTriangle,
} from "lucide-react";

const SOCKET_URL = "https://food-delivery-backend-0aib.onrender.com";

interface Message {
    _id: string;
    sender: "user" | "admin";
    text: string;
    isRead: boolean;
    createdAt: string;
}
interface ChatSession {
    _id: string;
    userName: string;
    lastMessage: string;
    lastMessageAt: string;
    isOpen: boolean;
    unreadByAdmin: number;
}
interface ChatThread {
    _id: string;
    userName: string;
    isOpen: boolean;
    messages: Message[];
}

/* ─── Beep (created lazily, once per event) ──── */
const playBeep = () => {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch { /* ignore autoplay restriction */ }
};

/* ─── Delete Confirm Dialog ───────────────────── */
interface DeleteDialogProps {
    userName: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}
const DeleteDialog = ({ userName, onConfirm, onCancel, loading }: DeleteDialogProps) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        />
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
        >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-1 text-base font-bold text-foreground">Delete Chat Thread</h3>
            <p className="mb-6 text-sm text-muted-foreground">
                Are you sure you want to permanently delete the chat with{" "}
                <span className="font-semibold text-foreground">{userName}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                </button>
            </div>
        </motion.div>
    </div>
);

/* ─── Main AdminChat component ───────────────── */
const AdminChat = () => {
    const restaurant = useRestaurantStore((s) => s.restaurant);
    const queryClient = useQueryClient();

    // Socket created ONCE — never recreated on re-renders
    const socketRef = useRef<Socket | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Use a ref to track activeChatId inside socket handlers without re-subscribing
    const activeChatIdRef = useRef<string | null>(null);

    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Keep ref in sync with state (no extra renders) ── */
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    /* ── Fetch chat list ────────────────────────── */
    const { data: chats = [], isLoading: listLoading, refetch: refetchList } = useQuery<ChatSession[]>({
        queryKey: ["admin-chats"],
        queryFn: () => chatApi.getAllChats().then((r) => r.data),
        refetchInterval: 60000, // reduced from 30s to avoid hammering
    });

    useEffect(() => {
        setTotalUnread(chats.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0));
    }, [chats]);

    /* ── Fetch active thread ────────────────────── */
    const { data: thread, isLoading: threadLoading } = useQuery<ChatThread>({
        queryKey: ["admin-chat-thread", activeChatId],
        queryFn: () => chatApi.getChatById(activeChatId!).then((r) => r.data),
        enabled: !!activeChatId,
    });

    /* ── Socket.IO — created ONCE on mount ──────── */
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;
        socket.emit("joinAdminChat");

        socket.on("chatMessage", (data: { chatId: string; userName: string; message: Message }) => {
            if (data.message.sender !== "user") return;
            playBeep();
            // Update chat list badge — update cache directly to avoid refetch storm
            queryClient.setQueryData<ChatSession[]>(["admin-chats"], (old) => {
                if (!old) return old;
                const exists = old.some((c) => c._id === data.chatId);
                if (!exists) {
                    // New chat — force a refetch
                    queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
                    return old;
                }
                return old.map((c) =>
                    c._id === data.chatId
                        ? {
                            ...c,
                            lastMessage: data.message.text,
                            lastMessageAt: data.message.createdAt,
                            // Only increment unread if this chat is NOT currently open
                            unreadByAdmin: c._id === activeChatIdRef.current
                                ? 0
                                : (c.unreadByAdmin || 0) + 1,
                        }
                        : c
                );
            });

            // If this chat is open in the right panel, append message live
            if (data.chatId === activeChatIdRef.current) {
                setIsTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                queryClient.setQueryData<ChatThread>(
                    ["admin-chat-thread", data.chatId],
                    (old) => {
                        if (!old) return old;
                        const exists = old.messages.some((m) => m._id === data.message._id);
                        if (exists) return old;
                        return { ...old, messages: [...old.messages, data.message] };
                    }
                );
            }
        });

        socket.on("typing", (data: { chatId: string }) => {
            if (data.chatId !== activeChatIdRef.current) return;
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        });

        socket.on("stopTyping", (data: { chatId: string }) => {
            if (data.chatId !== activeChatIdRef.current) return;
            setIsTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        });

        socket.on("chatClosed", () => {
            queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
        });

        // Cleanup: disconnect socket ONLY when component unmounts
        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []); // ← empty deps: socket created once, never recreated

    /* ── Auto-scroll (within container only) ───── */
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }, [thread?.messages, isTyping]);

    /* ── Open chat ──────────────────────────────── */
    const openChat = useCallback((chatId: string) => {
        setActiveChatId(chatId);
        setReplyText("");
        setIsTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // Zero unread badge instantly in local cache
        queryClient.setQueryData<ChatSession[]>(["admin-chats"], (old) =>
            old?.map((c) => c._id === chatId ? { ...c, unreadByAdmin: 0 } : c) ?? old
        );
    }, [queryClient]);

    /* ── Send reply ─────────────────────────────── */
    const handleSend = async () => {
        if (!replyText.trim() || !activeChatId) return;
        setSending(true);
        try {
            const res = await chatApi.adminReply(activeChatId, replyText.trim());
            const newMsg: Message = res.data;
            queryClient.setQueryData<ChatThread>(["admin-chat-thread", activeChatId], (old) => {
                if (!old) return old;
                return { ...old, messages: [...old.messages, newMsg] };
            });
            setReplyText("");
        } catch { /* error handled by axios interceptor */ }
        finally { setSending(false); }
    };

    /* ── Close chat ─────────────────────────────── */
    const closeThreadMutation = useMutation({
        mutationFn: (chatId: string) => chatApi.closeChat(chatId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
            queryClient.invalidateQueries({ queryKey: ["admin-chat-thread", activeChatId] });
        },
    });

    /* ── Delete chat ─────────────────────────────── */
    const deleteThreadMutation = useMutation({
        mutationFn: (chatId: string) => chatApi.deleteChat(chatId),
        onSuccess: () => {
            setActiveChatId(null);
            setDeleteTargetId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
        },
    });

    const formatTime = (date: string) => {
        try { return format(new Date(date), "h:mm a"); } catch { return ""; }
    };
    const formatDate = (date: string) => {
        try { return format(new Date(date), "MMM d"); } catch { return ""; }
    };

    const deleteTarget = chats.find((c) => c._id === deleteTargetId);

    return (
        <>
            {/* ── Delete Confirmation Dialog ─────────── */}
            <AnimatePresence>
                {deleteTargetId && (
                    <DeleteDialog
                        userName={deleteTarget?.userName ?? "this user"}
                        onConfirm={() => deleteThreadMutation.mutate(deleteTargetId)}
                        onCancel={() => setDeleteTargetId(null)}
                        loading={deleteThreadMutation.isPending}
                    />
                )}
            </AnimatePresence>

            <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

                {/* ── Left: Chat List ─────────────────────── */}
                <div className="flex w-full flex-col border-r border-border sm:w-80 flex-shrink-0">
                    <div className="flex items-center justify-between border-b border-border px-4 py-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-foreground">Support Chats</h2>
                            {totalUnread > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => refetchList()}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {listLoading ? (
                            <div className="space-y-1 p-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                                ))}
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <Inbox className="h-12 w-12 text-muted-foreground/30" />
                                <p className="mt-3 text-sm font-medium text-muted-foreground">No chats yet</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Customers will appear here when they start a conversation
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5 p-2">
                                {chats.map((chat) => (
                                    <button
                                        key={chat._id}
                                        onClick={() => openChat(chat._id)}
                                        className={`w-full rounded-xl px-3 py-3 text-left transition-all hover:bg-accent ${activeChatId === chat._id ? "bg-accent ring-1 ring-primary/30" : ""}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {chat.userName?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="truncate text-sm font-semibold text-foreground">{chat.userName}</p>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {chat.unreadByAdmin > 0 && (
                                                            <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                                                                {chat.unreadByAdmin}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground">{formatDate(chat.lastMessageAt)}</span>
                                                    </div>
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground mt-0.5">{chat.lastMessage || "No messages yet"}</p>
                                                {!chat.isOpen && (
                                                    <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-red-500">
                                                        <Circle className="h-1.5 w-1.5 fill-red-500" /> Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Chat Thread ──────────────────── */}
                <div className="flex flex-1 flex-col min-w-0">
                    {!activeChatId ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-base font-bold text-foreground">Select a conversation</p>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Choose a customer chat from the left to start responding
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                        {thread?.userName?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{thread?.userName || "Loading…"}</p>
                                        <p className="text-xs">
                                            {thread?.isOpen === false
                                                ? <span className="text-red-500 font-medium">Chat closed</span>
                                                : <span className="text-green-600 font-medium">Active</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {thread?.isOpen && (
                                        <button
                                            onClick={() => closeThreadMutation.mutate(activeChatId)}
                                            disabled={closeThreadMutation.isPending}
                                            title="Close chat"
                                            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            Close
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteTargetId(activeChatId)}
                                        disabled={deleteThreadMutation.isPending}
                                        title="Delete chat"
                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                            >
                                {threadLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                                                <div className="h-10 w-48 animate-pulse rounded-2xl bg-muted" />
                                            </div>
                                        ))}
                                    </div>
                                ) : thread?.messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
                                    </div>
                                ) : (
                                    thread?.messages.map((msg) => {
                                        const isAdmin = msg.sender === "admin";
                                        return (
                                            <motion.div
                                                key={msg._id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                            >
                                                {!isAdmin && (
                                                    <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground self-end">
                                                        {thread.userName?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={`max-w-[72%] ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                                                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${isAdmin
                                                        ? "rounded-br-sm bg-primary text-primary-foreground"
                                                        : "rounded-bl-sm bg-muted text-foreground"}`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <div className={`mt-1 flex items-center gap-1 text-[10px] text-muted-foreground ${isAdmin ? "flex-row-reverse" : ""}`}>
                                                        <span>{formatTime(msg.createdAt)}</span>
                                                        {isAdmin && <CheckCheck className={`h-3 w-3 ${msg.isRead ? "text-blue-500" : "text-muted-foreground"}`} />}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <div className="ml-2 self-end">
                                                        {restaurant?.logo ? (
                                                            <img src={restaurant.logo} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
                                                        ) : (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                                A
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}

                                {/* Typing indicator */}
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            key="typing"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            className="flex items-end gap-2"
                                        >
                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                                {thread?.userName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.span
                                                        key={i}
                                                        className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                                                        animate={{ y: [0, -4, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Input */}
                            {thread?.isOpen === false ? (
                                <div className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground bg-muted/30">
                                    This chat has been closed.
                                </div>
                            ) : (
                                <div className="border-t border-border px-4 py-3">
                                    <div className="flex items-end gap-2">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                                            }}
                                            placeholder="Type a reply… (Enter to send)"
                                            rows={1}
                                            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background transition-colors"
                                            style={{ maxHeight: 120, overflowY: "auto" }}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!replyText.trim() || sending}
                                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:brightness-110 disabled:opacity-50"
                                        >
                                            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminChat;
