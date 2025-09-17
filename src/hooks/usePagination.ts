import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  getCurrentPageItems: (items: T[]) => T[];
  canGoNext: boolean;
  canGoPrev: boolean;
}

export const usePagination = <T>({ 
  totalItems, 
  itemsPerPage = 12, 
  initialPage = 1 
}: UsePaginationProps): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPageState] = useState(initialPage);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  }, [startIndex, itemsPerPage, totalItems]);

  const canGoNext = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const canGoPrev = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const setCurrentPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPageState(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (canGoNext) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, canGoNext, setCurrentPage]);

  const prevPage = useCallback(() => {
    if (canGoPrev) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, canGoPrev, setCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages, setCurrentPage]);

  const getCurrentPageItems = useCallback((items: T[]): T[] => {
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [startIndex, itemsPerPage]);

  // Reset to first page when total items change
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPageState(1);
    }
  }, [totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    setCurrentPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    getCurrentPageItems,
    canGoNext,
    canGoPrev
  };
};

export default usePagination;