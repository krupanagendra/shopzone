// Skeleton loader for product cards — matches exact ProductCard dimensions
const SkeletonCard = () => (
    <div className="card animate-pulse">
        {/* Image placeholder */}
        <div className="bg-gray-200 h-48 w-full" />
        <div className="p-3 space-y-2">
            {/* Category pill */}
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            {/* Title */}
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            {/* Stars */}
            <div className="flex gap-1 pt-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-3 w-3 bg-gray-200 rounded-full" />
                ))}
                <div className="h-3 bg-gray-200 rounded w-12 ml-1" />
            </div>
            {/* Price */}
            <div className="h-6 bg-gray-200 rounded w-1/2 mt-1" />
            {/* Button */}
            <div className="h-9 bg-gray-200 rounded w-full mt-2" />
        </div>
    </div>
);

// Grid of skeleton cards — use count to match expected results
export const SkeletonGrid = ({ count = 8 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

// Skeleton for ProductDetailPage
export const SkeletonProductDetail = () => (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded w-16" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow p-6">
            {/* Image */}
            <div className="bg-gray-200 rounded-xl h-96" />
            {/* Details */}
            <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-7 bg-gray-200 rounded w-full" />
                <div className="h-7 bg-gray-200 rounded w-4/5" />
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-4 w-4 bg-gray-200 rounded-full" />)}
                    <div className="h-4 bg-gray-200 rounded w-20 ml-2" />
                </div>
                <div className="h-px bg-gray-200" />
                <div className="h-10 bg-gray-200 rounded w-1/3" />
                <div className="h-px bg-gray-200" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                </div>
                <div className="h-24 bg-gray-200 rounded-xl" />
                <div className="flex gap-3">
                    <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                </div>
            </div>
        </div>
    </div>
);

// Skeleton for HomePage featured section
export const SkeletonFeatured = ({ count = 4 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

// Skeleton for Orders list
export const SkeletonOrders = ({ count = 3 }) => (
    <div className="space-y-4 animate-pulse">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-40" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
                <div className="flex gap-2 mt-3">
                    {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-12 h-12 bg-gray-200 rounded-lg" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default SkeletonCard;
