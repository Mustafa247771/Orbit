import { Text, View } from "react-native";

type AvatarProps = {
  initials: string;
  size?: number;
  online?: boolean;
};

export function Avatar({ initials, size = 40, online = false }: AvatarProps) {
  return (
    <View style={{ width: size, height: size }}>
      <View className="flex-1 items-center justify-center rounded-full border border-line bg-surface">
        <Text
          className="font-display text-ink"
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials}
        </Text>
      </View>
      {online ? (
        <View
          accessibilityLabel="Online"
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-space bg-accent"
        />
      ) : null}
    </View>
  );
}
