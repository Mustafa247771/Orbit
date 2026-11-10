import { usingDemoKey } from "../model/ApodService";
import { useApodActions } from "./useApodActions";
import { useApodDay } from "./useApodDay";
import { useApodFavorites } from "./useApodFavorites";
import { useApodWeek } from "./useApodWeek";

/** Everything the APOD screen needs, as slices that match the components' props. */
export function useApodViewModel() {
  const day = useApodDay();
  const week = useApodWeek(day.selected, day.today, day.entry?.date ?? null);
  const favorites = useApodFavorites();
  const actions = useApodActions(day.entry);

  const selectSaved = (date: string) => {
    actions.closeSaved();
    day.goToDate(date);
  };

  return {
    status: {
      loading: day.loading,
      error: day.emptyError,
      retry: () => {
        day.retry();
        week.reload(true);
      },
    },
    refresh: {
      refreshing: day.refreshing,
      onRefresh: () => {
        day.refresh();
        week.reload(true);
      },
    },
    notices: {
      fallback: day.fallbackNotice,
      cached: day.notice,
      date: day.dateError,
      action: actions.error,
      favorites: favorites.error,
      favoritesSoft: favorites.notice,
    },
    openSaved: actions.openSaved,
    strip: {
      days: week.days,
      selected: day.selected,
      today: day.today,
      onSelect: day.goToDate,
      onOpenPicker: actions.openPicker,
      onPrev: day.goPrevious,
      onNext: day.goNext,
    },
    hero: {
      entry: day.entry,
      loading: day.loading,
      source: day.source ?? "live",
      saved: day.entry ? favorites.isSaved(day.entry.date) : false,
      busy: favorites.loading,
      onExpand: actions.openViewer,
      onWatch: actions.watch,
      onToggleFavorite: () => {
        if (day.entry) favorites.toggle(day.entry);
      },
      onShare: actions.share,
    },
    details: {
      archive: week.archive,
      savedCount: favorites.savedCount,
      onOpenStory: actions.openStory,
      onSelectDay: day.goToDate,
      onOpenSaved: actions.openSaved,
    },
    viewer: {
      visible: actions.viewerVisible,
      entry: day.entry,
      onClose: actions.closeViewer,
    },
    picker: {
      visible: actions.pickerVisible,
      selected: day.selected,
      today: day.today,
      onPick: day.goToDate,
      onClose: actions.closePicker,
    },
    saved: {
      visible: actions.savedVisible,
      items: favorites.items,
      onSelect: selectSaved,
      onRemove: favorites.remove,
      onClose: actions.closeSaved,
      error: favorites.error,
    },
    demoKey: usingDemoKey(),
  };
}
