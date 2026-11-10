import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import type { SavedLocation } from "../model/Profile";
import { validateLocationInput } from "../model/profileValidation";
import {
  removeLocation,
  renameLocation,
  setDefaultLocation,
} from "../model/savedLocations";
import { useAccountProfile } from "./ProfileProvider";

export function useManageLocations() {
  const account = useAccountProfile();
  const active = useRef(false);
  const request = useRef(0);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renameNames, setRenameNames] = useState<Record<string, string>>({});
  const [renameErrors, setRenameErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const locations = account.profile?.locations ?? [];

  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  function open() {
    if (active.current) return;
    request.current += 1;
    setRenameNames({});
    setRenameErrors({});
    setError(null);
    setVisible(true);
  }

  function close() {
    if (active.current) return;
    request.current += 1;
    setVisible(false);
  }

  async function persist(next: SavedLocation[]) {
    if (active.current) return false;
    if (!account.profile) {
      setError("Your profile is not ready. Sign in and try again.");
      return false;
    }
    const token = ++request.current;
    active.current = true;
    setSaving(true);
    setError(null);
    const saved = await account.setLocations(next);
    if (request.current !== token) return false;
    active.current = false;
    setSaving(false);
    return saved;
  }

  function setRenameName(id: string, value: string) {
    setRenameNames((previous) => ({ ...previous, [id]: value }));
    setRenameErrors((previous) => ({ ...previous, [id]: null }));
    setError(null);
  }

  async function rename(id: string) {
    if (active.current) return;
    const place = locations.find((item) => item.id === id);
    if (!place) return;
    const name = renameNames[id] ?? place.name;
    const errors = validateLocationInput({ ...place, name }, locations, id);
    setRenameErrors((previous) => ({ ...previous, [id]: errors.name ?? null }));
    if (Object.keys(errors).length) return;
    if (await persist(renameLocation(locations, id, name))) {
      setRenameNames((previous) => ({ ...previous, [id]: name.trim() }));
    }
  }

  async function setDefault(id: string) {
    if (active.current || !locations.some((place) => place.id === id)) return false;
    return persist(setDefaultLocation(locations, id));
  }

  function deleteLocation(id: string) {
    if (active.current) return;
    const place = locations.find((item) => item.id === id);
    if (!place) return;
    const token = ++request.current;
    Alert.alert(
      "Delete observing location?",
      `Remove ${place.name}?${place.isDefault ? " Another saved location will become the default if one remains." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (request.current !== token) return;
            if (await persist(removeLocation(locations, id))) {
              setRenameNames((previous) => {
                const next = { ...previous };
                delete next[id];
                return next;
              });
              setRenameErrors((previous) => {
                const next = { ...previous };
                delete next[id];
                return next;
              });
            }
          },
        },
      ],
    );
  }

  return {
    locations,
    visible,
    saving,
    renameNames,
    renameErrors,
    error,
    open,
    close,
    setRenameName,
    rename,
    setDefault,
    deleteLocation,
  };
}
