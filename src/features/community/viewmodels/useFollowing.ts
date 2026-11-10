import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import { useResetOnUid } from "./useResetOnUid";

const initial = {
  ids: [] as string[],
  ready: false,
  loadError: null as string | null,
  toggleError: null as string | null,
};

export function useFollowing(uid: string | null) {
  const [state, setState] = useState(initial);
  const current = useRef(state);
  const pending = useRef(new Set<string>());
  const loadRequest = useRef(0);
  const update = useCallback((next: typeof state) => {
    current.current = next;
    setState(next);
  }, []);
  const generationRef = useResetOnUid(uid, () => {
    pending.current = new Set();
    loadRequest.current++;
    update(initial);
  });

  const reload = useCallback(async () => {
    const token = ++loadRequest.current;
    const owner = generationRef.current;
    if (!uid) {
      update({ ...initial, ready: true });
      return;
    }
    try {
      const ids = await communityRepository.listFollowing(uid);
      if (owner !== generationRef.current || token !== loadRequest.current) return;
      const merged = new Set(ids);
      for (const id of pending.current) {
        if (current.current.ids.includes(id)) merged.add(id);
        else merged.delete(id);
      }
      update({ ...current.current, ids: [...merged], ready: true, loadError: null });
    } catch (failure) {
      if (owner === generationRef.current && token === loadRequest.current)
        update({ ...current.current, ready: true, loadError: communityErrorMessage(failure) });
    }
  }, [uid, update, generationRef]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        loadRequest.current++;
      };
    }, [reload]),
  );

  const toggle = useCallback(
    async (otherUid: string) => {
      if (!uid || otherUid === uid || pending.current.has(otherUid) || !current.current.ready)
        return;
      const active = pending.current;
      active.add(otherUid);
      const owner = generationRef.current;
      loadRequest.current++;
      const before = current.current;
      const on = !before.ids.includes(otherUid);
      update({
        ...before,
        ids: on ? [...before.ids, otherUid] : before.ids.filter((id) => id !== otherUid),
        toggleError: null,
      });
      try {
        await communityRepository.setFollowing(uid, otherUid, on);
      } catch (failure) {
        if (owner === generationRef.current) {
          const latest = current.current;
          update({
            ...latest,
            ids: on
              ? latest.ids.filter((id) => id !== otherUid)
              : [...new Set([...latest.ids, otherUid])],
            toggleError: communityErrorMessage(failure),
          });
        }
      } finally {
        active.delete(otherUid);
        if (owner === generationRef.current) loadRequest.current++;
      }
    },
    [uid, update, generationRef],
  );

  return { ...state, toggle, reload };
}
