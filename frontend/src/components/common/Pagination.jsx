const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  // Smart page range — show max 5 page buttons at once
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) range.unshift("...");
    if (page + delta < pages - 1) range.push("...");

    range.unshift(1);
    if (pages > 1) range.push(pages);

    return range;
  };

  return (
    <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 border rounded-lg font-semibold text-sm transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          hover:bg-amazon-yellow hover:border-amazon-yellow
          active:scale-95"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-gray-400 text-sm select-none">
            •••
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all active:scale-95
              ${p === page
                ? "bg-amazon-yellow border-2 border-amazon-orange text-black shadow-md scale-110"
                : "border hover:bg-amazon-yellow hover:border-amazon-yellow"
              }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-4 py-2 border rounded-lg font-semibold text-sm transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          hover:bg-amazon-yellow hover:border-amazon-yellow
          active:scale-95"
      >
        Next →
      </button>

      {/* Page info */}
      <span className="ml-3 text-sm text-gray-500">
        Page {page} of {pages}
      </span>
    </div>
  );
};

export default Pagination;
