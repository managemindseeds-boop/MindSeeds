/**
 * Reusable skeleton shimmer component for loading states.
 * Usage: <Skeleton className="w-32 h-4" /> or <Skeleton className="w-full h-10 rounded-xl" />
 */
function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    )
}

// Pre-built skeleton patterns
function SkeletonText({ lines = 3, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
            ))}
        </div>
    )
}

function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-5 space-y-3 ${className}`}>
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2.5 w-1/2" />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    )
}

function SkeletonTableRow({ cols = 6, className = '' }) {
    return (
        <tr className={`animate-pulse ${className}`}>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <Skeleton className={`h-3.5 ${i === 0 ? 'w-32' : 'w-20'}`} />
                </td>
            ))}
        </tr>
    )
}

function SkeletonKPICard() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-11 h-11 rounded-lg" />
            </div>
            <Skeleton className="h-2.5 w-20 mt-3" />
        </div>
    )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow, SkeletonKPICard }
export default Skeleton
