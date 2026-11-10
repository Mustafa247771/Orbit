import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { setDevicePreferences } from "@/core/preferences";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { deviceSettingsRepository } from "../model/deviceSettingsRepository";
import { profileRepository } from "../model/CloudProfileRepository";
import {
  DEFAULT_DEVICE_SETTINGS,
  EMPTY_ACCOUNT_PROFILE,
  type AccountProfile,
  type AccountSettings,
  type DeviceSettings,
  type SavedLocation,
} from "../model/Profile";
import { ensureOneDefault } from "../model/savedLocations";

const SAVE_FAILED =
  "Your changes could not be saved on this device. Please try again.";
const LOAD_FAILED =
  "Your saved settings could not be loaded, so defaults are shown.";

type LoadedProfile = {
  uid: string;
  profile: AccountProfile;
  // A real failure (load or save); shown as an error.
  error: string | null;
  // The data is safe on the phone but not yet on the account; shown softly.
  notice: string | null;
};

type DeviceSettingsValue = {
  settings: DeviceSettings;
  update: (patch: Partial<DeviceSettings>) => void;
};

type AccountProfileValue = {
  profile: AccountProfile | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  defaultLocation: SavedLocation | null;
  updateSettings: (patch: Partial<AccountSettings>) => void;
  setLocations: (next: SavedLocation[]) => Promise<boolean>;
  setPhotoUri: (uri: string | null) => Promise<boolean>;
  purge: (uid: string) => Promise<void>;
};

type ProfileContextValue = {
  device: DeviceSettingsValue;
  account: AccountProfileValue;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

type Queue = { current: Promise<void> };

// Runs saves one after another, so the last change is the one saved.
function enqueue<T>(queue: Queue, task: () => Promise<T>): Promise<T> {
  const next = queue.current.then(task);
  queue.current = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const uid = useAuthSession().user?.uid ?? null;

  const [deviceSettings, setDeviceSettings] = useState(DEFAULT_DEVICE_SETTINGS);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [seenUid, setSeenUid] = useState(uid);

  // A new sign-in (even as the same account) starts without a profile, so
  // nothing stale is shown while the real one loads.
  if (seenUid !== uid) {
    setSeenUid(uid);
    setLoaded(null);
  }

  const latestDevice = useRef(DEFAULT_DEVICE_SETTINGS);
  const deviceLoaded = useRef(false);
  const devicePending = useRef<Partial<DeviceSettings>>({});
  const deviceQueue = useRef<Promise<void>>(Promise.resolve());
  const latestProfile = useRef<LoadedProfile | null>(null);
  const accountQueue = useRef<Promise<void>>(Promise.resolve());
  const purged = useRef(new Set<string>());

  const writeDevice = useCallback((next: DeviceSettings) => {
    void enqueue(deviceQueue, async () => {
      try {
        await deviceSettingsRepository.write(next);
      } catch {
        setDeviceError(SAVE_FAILED);
      }
    });
  }, []);

  useEffect(() => {
    // Changes made before the read finishes are merged onto the saved values.
    const finish = (saved: DeviceSettings) => {
      const pending = devicePending.current;
      const next = { ...saved, ...pending };
      deviceLoaded.current = true;
      latestDevice.current = next;
      setDeviceSettings(next);
      if (Object.keys(pending).length > 0) writeDevice(next);
    };

    deviceSettingsRepository
      .read()
      .then(finish)
      .catch(() => {
        setDeviceError(LOAD_FAILED);
        finish(DEFAULT_DEVICE_SETTINGS);
      });
  }, [writeDevice]);

  useEffect(() => {
    setDevicePreferences(deviceSettings);
  }, [deviceSettings]);

  useEffect(() => {
    latestProfile.current = null;
    if (uid === null) return;
    let cancelled = false;

    const show = (next: LoadedProfile) => {
      if (cancelled) return;
      latestProfile.current = next;
      setLoaded(next);
    };

    // Reading goes through the same queue as writes, so it never races one.
    void enqueue(accountQueue, async () => {
      try {
        const { profile, notice } = await profileRepository.read(uid);
        show({ uid, profile, error: null, notice });
      } catch {
        show({ uid, profile: EMPTY_ACCOUNT_PROFILE, error: LOAD_FAILED, notice: null });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const updateDevice = useCallback(
    (patch: Partial<DeviceSettings>) => {
      const next = { ...latestDevice.current, ...patch };
      latestDevice.current = next;
      setDeviceSettings(next);
      setDeviceError(null);
      if (deviceLoaded.current) {
        writeDevice(next);
      } else {
        devicePending.current = { ...devicePending.current, ...patch };
      }
    },
    [writeDevice],
  );

  const saveProfile = useCallback(
    (change: (profile: AccountProfile) => AccountProfile): Promise<boolean> => {
      const current = latestProfile.current;
      if (!current || purged.current.has(current.uid)) {
        setDeviceError(SAVE_FAILED);
        return Promise.resolve(false);
      }

      const next = {
        uid: current.uid,
        profile: change(current.profile),
        error: null,
        notice: current.notice,
      };
      latestProfile.current = next;
      setLoaded(next);

      return enqueue(accountQueue, async () => {
        if (purged.current.has(next.uid)) return false;
        try {
          const { notice } = await profileRepository.write(next.uid, next.profile);
          const latest = latestProfile.current;
          if (latest?.uid === next.uid && latest.notice !== notice) {
            const settled = { ...latest, notice };
            latestProfile.current = settled;
            setLoaded(settled);
          }
          return true;
        } catch {
          const latest = latestProfile.current;
          if (latest?.uid === next.uid) {
            const failed = { ...latest, error: SAVE_FAILED };
            latestProfile.current = failed;
            setLoaded(failed);
          }
          return false;
        }
      });
    },
    [],
  );

  const updateSettings = useCallback(
    (patch: Partial<AccountSettings>) => {
      void saveProfile((profile) => ({
        ...profile,
        settings: {
          ...profile.settings,
          ...patch,
          notifications: {
            ...profile.settings.notifications,
            ...patch.notifications,
          },
        },
      }));
    },
    [saveProfile],
  );

  const setLocations = useCallback(
    (next: SavedLocation[]) =>
      saveProfile((profile) => ({
        ...profile,
        locations: ensureOneDefault(next),
      })),
    [saveProfile],
  );

  const setPhotoUri = useCallback(
    (photoUri: string | null) =>
      saveProfile((profile) => ({ ...profile, photoUri })),
    [saveProfile],
  );

  // Removes leftover phone files once pending writes are done, even after sign-out.
  const purge = useCallback(
    (uid: string) => {
      purged.current.add(uid);
      return enqueue(accountQueue, () => profileRepository.remove(uid));
    },
    [],
  );

  const current = loaded && loaded.uid === uid ? loaded : null;
  const profile = current?.profile ?? null;

  const value = useMemo<ProfileContextValue>(
    () => ({
      device: { settings: deviceSettings, update: updateDevice },
      account: {
        profile,
        loading: uid !== null && profile === null,
        error: current?.error ?? deviceError,
        notice: current?.notice ?? null,
        defaultLocation:
          profile?.locations.find((place) => place.isDefault) ?? null,
        updateSettings,
        setLocations,
        setPhotoUri,
        purge,
      },
    }),
    [
      deviceSettings,
      updateDevice,
      profile,
      uid,
      current?.error,
      current?.notice,
      deviceError,
      updateSettings,
      setLocations,
      setPhotoUri,
      purge,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

function useProfileContext(): ProfileContextValue {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("Profile hooks must be used inside ProfileProvider.");
  }

  return context;
}

export function useDeviceSettings(): DeviceSettingsValue {
  return useProfileContext().device;
}

export function useAccountProfile(): AccountProfileValue {
  return useProfileContext().account;
}
