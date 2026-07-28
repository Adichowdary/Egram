"use client";

import { motion } from "framer-motion";

export function ContactsSkeleton() {
    return (
        <div className="flex flex-col space-y-3 p-3 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-11 h-11 rounded-full skeleton-shimmer bg-zinc-800/60 flex-shrink-0 animate-pulse" />
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="h-3.5 w-2/3 rounded-md skeleton-shimmer bg-zinc-800/60 animate-pulse" />
                        <div className="h-2.5 w-1/2 rounded-md skeleton-shimmer bg-zinc-800/40 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MessagesSkeleton() {
    return (
        <div className="flex flex-col space-y-4 p-4 w-full flex-1 overflow-hidden">
            {/* Left message skeleton */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2.5 max-w-[75%]"
            >
                <div className="w-8 h-8 rounded-full skeleton-shimmer bg-zinc-800/60 flex-shrink-0" />
                <div className="p-3.5 rounded-2xl rounded-bl-sm bg-zinc-800/50 skeleton-shimmer w-48 space-y-2 border border-zinc-700/30">
                    <div className="h-3 w-full rounded bg-zinc-700/50 animate-pulse" />
                    <div className="h-3 w-3/4 rounded bg-zinc-700/50 animate-pulse" />
                </div>
            </motion.div>

            {/* Right message skeleton */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-end justify-end gap-2.5 self-end max-w-[75%]"
            >
                <div className="p-3.5 rounded-2xl rounded-br-sm bg-blue-600/20 skeleton-shimmer w-56 space-y-2 border border-blue-500/20">
                    <div className="h-3 w-full rounded bg-blue-400/30 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-blue-400/30 animate-pulse" />
                </div>
            </motion.div>

            {/* Left message skeleton */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-end gap-2.5 max-w-[75%]"
            >
                <div className="w-8 h-8 rounded-full skeleton-shimmer bg-zinc-800/60 flex-shrink-0" />
                <div className="p-3.5 rounded-2xl rounded-bl-sm bg-zinc-800/50 skeleton-shimmer w-64 space-y-2 border border-zinc-700/30">
                    <div className="h-3 w-full rounded bg-zinc-700/50 animate-pulse" />
                    <div className="h-3 w-4/5 rounded bg-zinc-700/50 animate-pulse" />
                </div>
            </motion.div>

            {/* Right message skeleton */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-end justify-end gap-2.5 self-end max-w-[75%]"
            >
                <div className="p-3.5 rounded-2xl rounded-br-sm bg-blue-600/20 skeleton-shimmer w-40 space-y-2 border border-blue-500/20">
                    <div className="h-3 w-full rounded bg-blue-400/30 animate-pulse" />
                </div>
            </motion.div>
        </div>
    );
}
