import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiSliders, FiX } from 'react-icons/fi'
import { AiFillStar } from 'react-icons/ai'
import { setFilters, clearFilters } from '../../redux/slices/productSlice'

const ProductFilters = ({ onClose }) => {
  const dispatch = useDispatch()
  const { categories, filters } = useSelector((state) => state.products)
  
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    minPrice: filters.minPrice || 0,
    maxPrice: filters.maxPrice || 10000,
    rating: filters.rating || 0,
    sort: filters.sort || 'newest',
  })

  const handleApply = () => {
    dispatch(setFilters(localFilters))
    onClose?.()
  }

  const handleReset = () => {
    const reset = { category: '', minPrice: 0, maxPrice: 10000, rating: 0, sort: 'newest' }
    setLocalFilters(reset)
    dispatch(clearFilters())
    onClose?.()
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <FiSliders /> Filters
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <select
          value={localFilters.sort}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, sort: e.target.value }))}
          className="input-field text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={localFilters.category === ''}
              onChange={() => setLocalFilters(prev => ({ ...prev, category: '' }))}
              className="accent-brand-600"
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={localFilters.category === cat}
                onChange={() => setLocalFilters(prev => ({ ...prev, category: cat }))}
                className="accent-brand-600"
              />
              <span className="text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Price Range: ${localFilters.minPrice} - ${localFilters.maxPrice === 10000 ? '10000+' : localFilters.maxPrice}
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Min Price</label>
            <input
              type="range"
              min="0"
              max="5000"
              step="10"
              value={localFilters.minPrice}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
              className="w-full accent-brand-600"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Max Price</label>
            <input
              type="range"
              min="0"
              max="10000"
              step="50"
              value={localFilters.maxPrice}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Rating</label>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={r}
                checked={localFilters.rating === r}
                onChange={() => setLocalFilters(prev => ({ ...prev, rating: r }))}
                className="accent-brand-600"
              />
              <span className="text-sm flex items-center gap-1">
                {r === 0 ? (
                  'All Ratings'
                ) : (
                  <>
                    {Array.from({ length: r }).map((_, i) => (
                      <AiFillStar key={i} className="text-yellow-400" size={14} />
                    ))}
                    <span>& up</span>
                  </>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={handleApply} className="w-full btn-primary py-2.5 text-sm">
          Apply Filters
        </button>
        <button onClick={handleReset} className="w-full btn-outline py-2.5 text-sm">
          Reset All
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
