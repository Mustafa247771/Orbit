import { useState } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { Observer } from "../model/communityTypes";
import { validateObserverSearch } from "../model/searchValidation";
import { useResetOnUid } from "./useResetOnUid";

type Following = {
  ready: boolean;
  loadError: string | null;
  toggleError: string | null;
  toggle: (uid: string) => Promise<void>;
};

export function useObserverSearch(uid: string | null, following: Following) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Observer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useResetOnUid(uid, () => {
    setVisible(false);
    setQuery("");
    setResults([]);
    setError(null);
    setLoading(false);
    setSearched(false);
  });

  const search = async () => {
    const token = ++generationRef.current;
    const problem = validateObserverSearch(query);
    setError(problem);
    setResults([]);
    setSearched(false);
    setLoading(false);
    if (problem) return;
    if (!uid) {
      setError("Sign in to find observers.");
      return;
    }
    setLoading(true);
    try {
      const observers = await communityRepository.searchObservers(query.trim());
      if (token === generationRef.current) {
        setResults(observers.filter((observer) => observer.uid !== uid));
        setSearched(true);
      }
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      if (token === generationRef.current) setLoading(false);
    }
  };
  return {
    toggleFollow: following.toggle,
    followError: following.toggleError ?? following.loadError,
    followingReady: following.ready,
    visible,
    query,
    results,
    loading,
    searched,
    error,
    open: () => {
      setVisible(true);
    },
    close: () => {
      generationRef.current++;
      setVisible(false);
      setLoading(false);
    },
    setQuery: (value: string) => {
      generationRef.current++;
      setQuery(value);
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
    },
    search: () => {
      void search();
    },
  };
}
