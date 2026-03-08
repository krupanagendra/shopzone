import { FiStar } from 'react-icons/fi'
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'

// Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-10 h-10', lg: 'w-16 h-16' }
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${sizes[size]} border-4 border-gray-200 border-t-gold rounded-full animate-spin`} />
    </div>
  )
}

// Star Rating Display
export const StarRating = ({ rating, numReviews, size = 'sm' }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 22

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= Math.round(rating) ? (
              <AiFillStar size={iconSize} />
            ) : (
              <AiOutlineStar size={iconSize} />
            )}
          </span>
        ))}
      </div>
      {numReviews !== undefined && (
        <span className="text-gray-500 text-xs ml-1">({numReviews})</span>
      )}
    </div>
  )
}

// Interactive Star Rating (for reviews)
export const StarRatingInput = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0)
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          {star <= (hover || rating) ? (
            <AiFillStar size={28} className="text-yellow-400" />
          ) : (
            <AiOutlineStar size={28} className="text-gray-300" />
          )}
        </button>
      ))}
    </div>
  )
}

import { useState } from 'react'

// Pagination
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1)

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors text-sm"
      >
        ←
      </button>
      {pageNumbers.map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            num === page
              ? 'bg-dark text-white border-dark'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          {num}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors text-sm"
      >
        →
      </button>
    </div>
  )
}

// Price display
export const PriceDisplay = ({ price, originalPrice, discount }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-xl font-bold text-red-600">${price?.toFixed(2)}</span>
    {originalPrice && originalPrice > price && (
      <>
        <span className="text-sm text-gray-400 line-through">${originalPrice?.toFixed(2)}</span>
        {discount > 0 && (
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">-{discount}%</span>
        )}
      </>
    )}
  </div>
)

// Empty state
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-16 px-4">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {action}
  </div>
)

// Status Badge
export const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`badge ${colors[status] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {status}
    </span>
  )
}
