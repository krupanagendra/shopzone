import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../redux/slices/productSlice";
import ProductCard from "../components/product/ProductCard";
import FilterSidebar from "../components/product/FilterSidebar";
import Pagination from "../components/common/Pagination";
import Spinner from "../components/common/Spinner";
import { FaSlidersH, FaTimes } from "react-icons/fa";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Top Rated" },
];

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products, loading, page, pages, total } = useSelector((s) => s.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "newest",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Sync URL → filters when navbar search or category link changes
  useEffect(() => {
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "";
    if (keyword !== filters.keyword || category !== filters.category) {
      setFilters((f) => ({ ...f, keyword, category, page: 1 }));
    }
  }, [searchParams]);

  // Fetch products whenever filters change
  useEffect(() => {
    dispatch(fetchProducts(filters));
    // Mirror filters into URL
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params, { replace: true });
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters, dispatch]);

  const handleFilterChange = (newFilters) => {
    setFilters((f) => ({ ...f, ...newFilters, page: 1 }));
  };

  // ← THIS is the key fix: page change does NOT reset to page 1
  const handlePageChange = (newPage) => {
    setFilters((f) => ({ ...f, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {filters.keyword
              ? `Results for "${filters.keyword}"`
              : filters.category || "All Products"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} products found
            {pages > 1 && ` — Page ${page} of ${pages}`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 btn-secondary text-sm"
          >
            {showFilters ? <FaTimes /> : <FaSlidersH />}
            {showFilters ? "Hide" : "Filters"}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ sort: e.target.value })}
            className="input-field text-sm w-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} md:block w-64 flex-shrink-0`}>
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Products + Pagination */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-semibold">No products found</p>
              <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
              <button
                onClick={() => setFilters({ keyword: "", category: "", minPrice: "", maxPrice: "", rating: "", sort: "newest", page: 1 })}
                className="mt-4 btn-primary text-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* ← Fixed Pagination */}
              <Pagination
                page={page}
                pages={pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
