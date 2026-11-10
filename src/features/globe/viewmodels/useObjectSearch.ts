import {
  objectSearchResults,
  type CatalogueMode,
} from "@/core/satellites/catalogueFilters";
import type { CatalogueObject } from "@/core/satellites/catalogueTypes";
import { useCallback, useMemo, useState } from "react";

export function useObjectSearch(
  objects: CatalogueObject[],
  mode: CatalogueMode | null,
  trackedIds: ReadonlySet<number>,
  selectSatellite: (id: number) => void,
) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchResults = useMemo(
    () => objectSearchResults(objects, query, mode, trackedIds),
    [objects, query, mode, trackedIds],
  );
  const selectFromSearch = useCallback(
    (id: number) => {
      selectSatellite(id);
      setSearchOpen(false);
    },
    [selectSatellite],
  );

  return {
    query,
    setQuery,
    searchOpen,
    setSearchOpen,
    searchResults,
    selectFromSearch,
  };
}
