import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

// The player's lifecycle follows the app, not the individual navigation screens.
const AMBIENT_TRACK = require("../../../assets/audio/orbit-ambient.mp3");
const MUTED_PREFERENCE = new File(Paths.document, "orbit-music-muted.txt");

type BackgroundMusicContextValue = {
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
};

const BackgroundMusicContext = createContext<BackgroundMusicContextValue | null>(null);

export function BackgroundMusicProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(AMBIENT_TRACK);
  const playbackStatus = useAudioPlayerStatus(player);
  const [musicEnabled, setEnabled] = useState<boolean | null>(null);
  const changedByUser = useRef(false);

  // Read the saved preference before starting playback, so a muted app stays silent on launch.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      let wasMuted = false;
      try {
        if (MUTED_PREFERENCE.exists) {
          wasMuted = (await MUTED_PREFERENCE.text()).trim() === "true";
        }
      } catch (error) {
        console.warn("Orbit could not read the music preference:", error);
      }
      if (!cancelled && !changedByUser.current) setEnabled(!wasMuted);
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (musicEnabled === null || !playbackStatus.isLoaded) return;

    if (!musicEnabled) {
      player.pause();
      player.setActiveForLockScreen(false);
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
        if (cancelled) return;
        player.loop = true;
        player.volume = 0.35;
        player.setActiveForLockScreen(true, {
          title: "Orbit ambient soundtrack",
          artist: "Orbit",
          albumTitle: "Orbit",
        });
        player.play();
      } catch (error) {
        console.warn("Orbit could not start background music:", error);
      }
    };
    void start();
    return () => { cancelled = true; };
  }, [musicEnabled, playbackStatus.isLoaded, player]);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    changedByUser.current = true;
    setEnabled(enabled);
    try {
      if (!MUTED_PREFERENCE.exists) MUTED_PREFERENCE.create();
      MUTED_PREFERENCE.write(enabled ? "false" : "true");
    } catch (error) {
      console.warn("Orbit could not save the music preference:", error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({ musicEnabled: musicEnabled === true, setMusicEnabled }),
    [musicEnabled, setMusicEnabled],
  );

  return (
    <BackgroundMusicContext.Provider value={contextValue}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

export function useBackgroundMusic() {
  const context = useContext(BackgroundMusicContext);
  if (!context) {
    throw new Error("useBackgroundMusic must be used inside BackgroundMusicProvider");
  }
  return context;
}
