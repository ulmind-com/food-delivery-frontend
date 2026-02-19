import { motion } from "framer-motion";
import { Sun, Moon, Cloud, Star } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    // Check if system is dark
    const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && systemIsDark);

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">Light</span>
            <button
                onClick={toggleTheme}
                className={`relative flex h-8 w-16 cursor-pointer items-center rounded-full p-1 transition-colors duration-500 ${isDark ? "bg-slate-900" : "bg-blue-400"
                    }`}
                aria-label="Toggle theme"
            >
                {/* Background Decor */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                    {/* Stars for Dark Mode */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 1 : 0, y: isDark ? 0 : 10 }}
                        className="absolute left-2 top-1.5"
                    >
                        <div className="h-0.5 w-0.5 rounded-full bg-white opacity-80 shadow-[4px_2px_0_white,8px_-1px_0_white]" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 1 : 0, y: isDark ? 0 : -5 }}
                        className="absolute right-8 bottom-3"
                    >
                        <div className="h-0.5 w-0.5 rounded-full bg-white opacity-60" />
                    </motion.div>

                    {/* Clouds for Light Mode */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 0 : 1, x: isDark ? -10 : 0 }}
                        className="absolute right-2 top-2"
                    >
                        <Cloud className="h-3 w-3 text-white/50 fill-white/50" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 0 : 1, x: isDark ? -5 : 0 }}
                        className="absolute right-5 bottom-1"
                    >
                        <div className="h-1.5 w-3 rounded-full bg-white/40" />
                    </motion.div>
                </div>

                {/* Toggle Circle */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                    animate={{ x: isDark ? 32 : 0 }}
                >
                    <motion.div
                        initial={false}
                        animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        {isDark && <Moon className="h-3.5 w-3.5 text-slate-900" fill="currentColor" />}
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ rotate: isDark ? -180 : 0, scale: isDark ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        {!isDark && <Sun className="h-3.5 w-3.5 text-orange-400" fill="currentColor" />}
                    </motion.div>
                </motion.div>
            </button>
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">Dark</span>
        </div>
    );
}
