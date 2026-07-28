export function PostSkeleton() {
    return (
        <div className="ig-post glass border-[var(--card-border)] rounded-2xl relative overflow-hidden p-4 space-y-4">
            <div className="post-header flex items-center gap-3">
                <div className="w-10 h-10 rounded-full skeleton-shimmer bg-zinc-800/60 animate-pulse"></div>
                <div className="flex flex-col gap-2 flex-1">
                    <div className="w-32 h-3.5 rounded skeleton-shimmer bg-zinc-800/60 animate-pulse"></div>
                    <div className="w-16 h-2.5 rounded skeleton-shimmer bg-zinc-800/40 animate-pulse"></div>
                </div>
            </div>
            <div className="w-full h-72 rounded-xl skeleton-shimmer bg-zinc-800/50"></div>
            <div className="flex flex-col gap-2 pt-1">
                <div className="w-3/4 h-3.5 rounded skeleton-shimmer bg-zinc-800/60 animate-pulse"></div>
                <div className="w-1/2 h-3 rounded skeleton-shimmer bg-zinc-800/40 animate-pulse"></div>
            </div>
        </div>
    );
}

export function RoomSkeleton() {
    return (
        <div className="meet-item glass border-[var(--card-border)] rounded-xl flex justify-between p-4 items-center">
            <div className="flex flex-col gap-2.5 w-full">
                <div className="w-3/4 h-4 rounded skeleton-shimmer bg-zinc-800/60 animate-pulse"></div>
                <div className="w-1/2 h-3 rounded skeleton-shimmer bg-zinc-800/40 animate-pulse"></div>
            </div>
            <div className="w-20 h-9 rounded-xl skeleton-shimmer bg-zinc-800/60 ml-4 flex-shrink-0"></div>
        </div>
    );
}
