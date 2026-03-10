import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 20;

export function usePagination<T>(items: T[], pageSize = ITEMS_PER_PAGE) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Reset to page 1 when items change significantly
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    setCurrentPage,
    totalItems: items.length,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, items.length),
  };
}
