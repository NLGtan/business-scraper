"use client";

import { useMemo, useState } from "react";

import type { BusinessRecord } from "@/types/business";

export type SortBy = "rating" | "review_count" | "name";
export type SortDirection = "asc" | "desc";

export interface TableFilters {
  hasWebsite: boolean;
  hasPhone: boolean;
  minRating: number;
}

const defaultFilters: TableFilters = {
  hasWebsite: false,
  hasPhone: false,
  minRating: 0,
};

export function useBusinessTable(records: BusinessRecord[]) {
  const [filters, setFilters] = useState<TableFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      if (filters.hasWebsite && !record.has_website) {
        return false;
      }
      if (filters.hasPhone && !record.has_phone) {
        return false;
      }
      if ((record.rating ?? 0) < filters.minRating) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      const left = sortBy === "rating" ? a.rating ?? 0 : a.review_count ?? 0;
      const right = sortBy === "rating" ? b.rating ?? 0 : b.review_count ?? 0;
      return left - right;
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [filters, records, sortBy, sortDirection]);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.has(record.place_id)),
    [records, selectedIds],
  );

  const isAllVisibleSelected = useMemo(() => {
    if (filteredRecords.length === 0) {
      return false;
    }
    return filteredRecords.every((record) => selectedIds.has(record.place_id));
  }, [filteredRecords, selectedIds]);

  function toggleSelect(placeId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }

  function toggleSelectVisible() {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (isAllVisibleSelected) {
        filteredRecords.forEach((record) => next.delete(record.place_id));
      } else {
        filteredRecords.forEach((record) => next.add(record.place_id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    selectedIds,
    selectedRecords,
    filteredRecords,
    isAllVisibleSelected,
    toggleSelect,
    toggleSelectVisible,
    clearSelection,
  };
}

