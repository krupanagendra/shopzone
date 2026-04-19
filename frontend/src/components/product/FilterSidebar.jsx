import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../redux/slices/productSlice";
import { FaFilter, FaTimes, FaMobileAlt, FaLaptop, FaTshirt, FaHome, FaBook, FaGamepad, FaDumbbell, FaCamera, FaHeart, FaMusic, FaBoxOpen, FaDollarSign, FaStar, FaCheck, FaShoppingBag } from "react-icons/fa";

const ALL_CATEGORIES = [
  { label: "Electronics", Icon: FaMobileAlt },
  { label: "Computers", Icon: FaLaptop },
  { label: "Clothing", Icon: FaTshirt },
  { label: "Home & Kitchen", Icon: FaHome },
  { label: "Books", Icon: FaBook },
  { label: "Gaming", Icon: FaGamepad },
  { label: "Sports", Icon: FaDumbbell },
  { label: "Cameras", Icon: FaCamera },
  { label: "Beauty", Icon: FaHeart },
  { label: "Health", Icon: FaHeart },
  { label: "Toys", Icon: FaGamepad },
  { label: "Music", Icon: FaMusic },
  { label: "Automotive", Icon: FaBoxOpen },
  { label: "Pet Supplies", Icon: FaHeart },
];

const FilterSidebar = ({ filters, onFilterChange }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.products);
  const [minPrice, setMinPrice] = useState(filters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || "");

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const applyPriceFilter = () => onFilterChange({ minPrice, maxPrice });

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    onFilterChange({ category: "", minPrice: "", maxPrice: "", rating: "" });
  };

  // Merge DB categories with our list to ensure all show with icons
  const mergedCategories = ALL_CATEGORIES.filter(
    (c) => categories.includes(c.label) || categories.length === 0
  );

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.rating;

  return (
    <div className="bg-white dark:bg-slate-800/60 dark:border dark:border-slate-700/50 dark:backdrop-blur-xl rounded-xl shadow p-4 space-y-5 sticky top-24 transition-colors duration-300">

      {/* Header */}
      <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
          <FaFilter className="text-amazon-blue dark:text-omnikart-accent" /> Filters
        </div>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
            <FaTimes className="text-xs" /> Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Category</h3>
        <ul className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
          <li>
            <button
              onClick={() => onFilterChange({ category: "" })}
              className={`text-sm w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors
                ${!filters.category
                  ? "bg-amber-50 dark:bg-omnikart-accent/10 text-amazon-blue dark:text-omnikart-accent font-bold border-l-4 border-amazon-yellow"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
            >
              <FaShoppingBag /> All Categories
            </button>
          </li>
          {mergedCategories.map((cat) => (
            <li key={cat.label}>
              <button
                onClick={() => onFilterChange({ category: cat.label })}
                className={`text-sm w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors
                  ${filters.category === cat.label
                    ? "bg-amber-50 dark:bg-omnikart-accent/10 text-amazon-blue dark:text-omnikart-accent font-bold border-l-4 border-amazon-yellow"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
              >
                <cat.Icon className="flex-shrink-0" />
                <span>{cat.label}</span>
                {filters.category === cat.label && (
                  <FaCheck className="ml-auto text-amazon-yellow text-xs" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"><FaDollarSign /> Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input-field text-sm w-full"
          />
          <input
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input-field text-sm w-full"
          />
        </div>
        <button onClick={applyPriceFilter} className="mt-2 w-full btn-primary text-sm py-1.5">
          Apply Price
        </button>
        {(filters.minPrice || filters.maxPrice) && (
          <button
            onClick={() => { setMinPrice(""); setMaxPrice(""); onFilterChange({ minPrice: "", maxPrice: "" }); }}
            className="mt-1 text-xs text-red-500 w-full text-center"
          >
            Clear price filter
          </button>
        )}
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"><FaStar className="text-amber-400" /> Min Rating</h3>
        {[4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => onFilterChange({ rating: r })}
            className={`flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded transition-colors
              ${filters.rating == r
                ? "bg-amber-50 dark:bg-omnikart-accent/10 text-amazon-blue dark:text-omnikart-accent font-bold border-l-4 border-amazon-yellow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
          >
            <span className="text-amber-400">{"★".repeat(r)}</span>
            <span className="text-gray-300 dark:text-slate-600">{"★".repeat(5 - r)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">& up</span>
          </button>
        ))}
        {filters.rating && (
          <button onClick={() => onFilterChange({ rating: "" })} className="text-xs text-red-500 mt-1 w-full text-center">
            Clear rating
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;

