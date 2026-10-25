import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text } from "react-native";

type Category<T extends string> = {
  id: T;
  label: string;
};

type CategoryChipsProps<T extends string> = {
  categories: readonly Category<T>[];
  value: T;
  onChange: (id: T) => void;
};

export function CategoryChips<T extends string>({
  categories,
  value,
  onChange,
}: CategoryChipsProps<T>) {
  const choose = (id: T) => {
    if (id === value) return;
    Haptics.selectionAsync();
    onChange(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4 grow-0"
      contentContainerClassName="gap-2 px-5"
    >
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            onPress={() => choose(category.id)}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`h-9 justify-center rounded-full border px-4 ${selected ? "border-cyan/50 bg-cyan/15" : "border-line"}`}
          >
            <Text
              className={`text-[13px] ${selected ? "font-semibold text-cyan" : "text-muted"}`}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
