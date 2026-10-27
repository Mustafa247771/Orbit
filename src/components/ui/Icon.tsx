import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import colors from "@/theme/colors";

const ICONS = {
  back: { ios: "chevron.left", android: "arrow_back" },
  eye: { ios: "eye", android: "visibility" },
  flame: { ios: "flame", android: "local_fire_department" },
  launch: { ios: "airplane.departure", android: "rocket_launch" },
  menu: { ios: "line.3.horizontal", android: "menu" },
  globe: { ios: "globe.europe.africa", android: "public" },
  lock: { ios: "lock", android: "lock" },
  moon: { ios: "moon", android: "bedtime" },
  satellite: {
    ios: "antenna.radiowaves.left.and.right",
    android: "satellite_alt",
  },
  sun: { ios: "sun.max", android: "wb_sunny" },
  check: { ios: "checkmark", android: "check" },
  comment: { ios: "bubble.left", android: "mode_comment" },
  send: { ios: "paperplane", android: "send" },
  star: { ios: "star", android: "star" },
  starFilled: { ios: "star.fill", android: "star" },
  expand: {
    ios: "arrow.up.left.and.arrow.down.right",
    android: "open_in_full",
  },
  close: { ios: "xmark", android: "close" },
  bookmarkFilled: { ios: "bookmark.fill", android: "bookmark_added" },
  open: { ios: "arrow.up.right", android: "north_east" },
  bookmark: { ios: "bookmark", android: "bookmark" },
  calendar: { ios: "calendar", android: "calendar_month" },
  add: { ios: "plus", android: "add" },
  camera: { ios: "camera", android: "photo_camera" },
  chevron: { ios: "chevron.right", android: "chevron_right" },
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  remove: { ios: "minus", android: "remove" },
  edit: { ios: "pencil", android: "edit" },
  search: { ios: "magnifyingglass", android: "search" },
  share: { ios: "square.and.arrow.up", android: "share" },
  refresh: { ios: "arrow.clockwise", android: "refresh" },
  photo: { ios: "photo", android: "image" },
  location: { ios: "location", android: "location_on" },
} satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
};

export function Icon({ name, size = 20, color = colors.ink }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
