import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { Share } from "react-native";

import type { ApodEntry } from "../model/Apod";

const SHARE_FAILED = "Couldn't open sharing. Please try again.";
const OPEN_FAILED = "Couldn't open that page. Check your connection and try again.";

/** Share, open links and which sheet or viewer is open. */
export function useApodActions(entry: ApodEntry | null) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(async () => {
    if (!entry) return;
    setError(null);
    try {
      await Share.share({
        title: entry.title,
        message: `${entry.title}\n${entry.pageUrl}`,
        url: entry.pageUrl,
      });
    } catch {
      setError(SHARE_FAILED);
    }
  }, [entry]);

  const openLink = useCallback(async (url: string) => {
    setError(null);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      setError(OPEN_FAILED);
    }
  }, []);

  return {
    error,
    share,
    watch: () => (entry ? openLink(entry.videoUrl ?? entry.pageUrl) : undefined),
    openStory: () => (entry ? openLink(entry.pageUrl) : undefined),
    viewerVisible: viewerOpen && entry?.kind === "image",
    openViewer: () => setViewerOpen(entry?.kind === "image"),
    closeViewer: () => setViewerOpen(false),
    pickerVisible: pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    savedVisible: savedOpen,
    openSaved: () => setSavedOpen(true),
    closeSaved: () => setSavedOpen(false),
  };
}
