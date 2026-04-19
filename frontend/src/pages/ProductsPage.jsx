import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../redux/slices/productSlice";
import ProductCard from "../components/product/ProductCard";
import FilterSidebar from "../components/product/FilterSidebar";
import Pagination from "../components/common/Pagination";
import { SkeletonGrid } from "../components/common/SkeletonCard";
import { FaSlidersH, FaSearch } from "react-icons/fa";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products, loading, page, pages, total, suggestion } = useSelector((s) => s.products);
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

  useEffect(() => {
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "";
    if (keyword !== filters.keyword || category !== filters.category) {
      setFilters((f) => ({ ...f, keyword, category, page: 1 }));
    }
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
  }, [filters, dispatch]);

  const handleFilterChange = (newFilters) => {
    setFilters((f) => ({ ...f, ...newFilters, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {filters.keyword ? `Results for "${filters.keyword}"` : filters.category || "All Products"}
          </h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Loading..." : `${total} products found`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 btn-secondary text-sm">
            <FaSlidersH /> Filters
          </button>
          <select value={filters.sort} onChange={(e) => handleFilterChange({ sort: e.target.value })}
            className="input-field text-sm w-auto">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 flex-shrink-0`}>
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {suggestion && products.length === 0 && (
            <div className="bg-amber-50 border border-amazon-yellow rounded-lg p-4 mb-4 flex items-center justify-between shadow-sm">
              <p className="text-gray-700 text-lg">
                Did you mean <button onClick={() => handleFilterChange({ keyword: suggestion })} className="font-bold text-amazon-blue hover:text-amazon-orange underline">"{suggestion}"</button>?
              </p>
            </div>
          )}

          {loading ? (
            <SkeletonGrid count={12} />
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FaSearch className="text-5xl mb-4 text-gray-300" />
              <p className="text-xl font-semibold">No products found</p>
              <p className="text-sm mt-2">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
              <Pagination page={page} pages={pages} onPageChange={(p) => handleFilterChange({ page: p })} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
