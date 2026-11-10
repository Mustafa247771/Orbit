import { useEffect, useRef, useState } from "react";

import { currentPlace, searchPlaces, type Place } from "../model/LocationService";
import { MAX_LOCATIONS } from "../model/Profile";
import {
  PLACE_NAME_MAX,
  validateLocationInput,
  validateSearchQuery,
} from "../model/profileValidation";
import { addLocation } from "../model/savedLocations";
import { useAccountProfile } from "./ProfileProvider";

export type LocationsBusy = "locating" | "searching" | "saving" | null;

export function useLocationsViewModel() {
  const account = useAccountProfile();
  const active = useRef<LocationsBusy>(null);
  const request = useRef(0);
  const [addVisible, setAddVisible] = useState(false);
  const [busy, setBusy] = useState<LocationsBusy>(null);
  const [query, setQueryText] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [pickedPlace, setPickedPlace] = useState<Place | null>(null);
  const [name, setNameText] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  const locations = account.profile?.locations ?? [];
  const canAdd = account.profile !== null && locations.length < MAX_LOCATIONS;

  function changeBusy(value: LocationsBusy) {
    active.current = value;
    setBusy(value);
  }

  function readyToAdd() {
    if (!account.profile) {
      setError("Your profile is not ready. Sign in and try again.");
      return false;
    }
    if (locations.length >= MAX_LOCATIONS) {
      setError(`You can save up to ${MAX_LOCATIONS} places. Remove one first.`);
      return false;
    }
    return true;
  }

  function openAdd() {
    if (active.current || !readyToAdd()) return;
    setQueryText("");
    setResults([]);
    setSearchSource(null);
    setQueryError(null);
    setPickedPlace(null);
    setNameText("");
    setNameError(null);
    setError(null);
    setAddVisible(true);
  }

  function closeAdd() {
    if (active.current === "saving") return;
    request.current += 1;
    changeBusy(null);
    setAddVisible(false);
  }

  function setQuery(value: string) {
    setQueryText(value);
    setQueryError(null);
    setResults([]);
    setSearchSource(null);
  }

  function pickPlace(place: Place) {
    if (active.current) return;
    setPickedPlace(place);
    setNameText(place.name.slice(0, PLACE_NAME_MAX));
    setNameError(null);
    setError(null);
  }

  function setName(value: string) {
    setNameText(value);
    setNameError(null);
    setError(null);
  }

  async function useCurrentLocation() {
    if (active.current || !readyToAdd()) return;
    const token = ++request.current;
    changeBusy("locating");
    setError(null);
    try {
      const place = await currentPlace();
      if (request.current !== token) return;
      setPickedPlace(place);
      setNameText(place.name.slice(0, PLACE_NAME_MAX));
      setNameError(null);
      setResults([]);
      setSearchSource(null);
    } catch (caught) {
      if (request.current === token) {
        setError(
          caught instanceof Error ? caught.message : "Could not find your location. Try again.",
        );
      }
    } finally {
      if (request.current === token) changeBusy(null);
    }
  }

  async function search() {
    if (active.current || !readyToAdd()) return;
    const problem = validateSearchQuery(query);
    setQueryError(problem);
    if (problem) return;
    const token = ++request.current;
    changeBusy("searching");
    setError(null);
    setResults([]);
    setSearchSource(null);
    try {
      const found = await searchPlaces(query);
      if (request.current !== token) return;
      setResults(found.places);
      setSearchSource(found.source);
    } catch (caught) {
      if (request.current === token) {
        setError(
          caught instanceof Error ? caught.message : "Could not search for places. Try again.",
        );
      }
    } finally {
      if (request.current === token) changeBusy(null);
    }
  }

  async function save() {
    if (active.current || !readyToAdd()) return;
    if (!pickedPlace) {
      setError("Use your current location or choose a search result first.");
      return;
    }
    const input = { ...pickedPlace, name };
    const errors = validateLocationInput(input, locations);
    setNameError(errors.name ?? null);
    if (errors.name) return;
    if (Object.keys(errors).length) {
      setError("This place has invalid coordinates. Choose another place.");
      return;
    }
    const token = ++request.current;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    changeBusy("saving");
    setError(null);
    const saved = await account.setLocations(addLocation(locations, input, id));
    if (request.current !== token) return;
    changeBusy(null);
    if (saved) setAddVisible(false);
  }

  return {
    locations,
    canAdd,
    addVisible,
    busy,
    query,
    queryError,
    results,
    searched: searchSource !== null,
    pickedPlace,
    name,
    nameError,
    error,
    searchSource,
    openAdd,
    closeAdd,
    setQuery,
    search,
    useCurrentLocation,
    pickPlace,
    setName,
    save,
  };
}
