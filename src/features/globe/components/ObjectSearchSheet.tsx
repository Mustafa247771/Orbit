import { FlatList, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import type { objectSearchResults } from "@/core/satellites/catalogueFilters";
import { OBJECT_LABELS } from "@/core/satellites/catalogueTypes";

type ObjectSearchSheetProps = {
  visible: boolean;
  query: string;
  results: ReturnType<typeof objectSearchResults>;
  trackedIds: ReadonlySet<number>;
  loaded: boolean;
  saving: boolean;
  refreshing: boolean;
  error: string | null;
  onClose: () => void;
  onChangeQuery: (query: string) => void;
  onSelect: (id: number) => void;
  onToggleTracked: (id: number) => void;
};

export function ObjectSearchSheet({
  visible,
  query,
  results,
  trackedIds,
  loaded,
  saving,
  refreshing,
  error,
  onClose,
  onChangeQuery,
  onSelect,
  onToggleTracked,
}: ObjectSearchSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close object search"
      eyebrow="Orbital catalogue"
      title="Find and track an object"
    >
      <View className="mb-3 mt-4">
        <TextField
          label="Search by name or NORAD ID"
          value={query}
          onChangeText={onChangeQuery}
          maxLength={80}
          placeholder="Name or NORAD ID"
        />
      </View>
      <FormMessage size="xs" className="mb-2">
        {error}
      </FormMessage>
      <FlatList
        className="h-80 shrink"
        data={results}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <FormMessage tone="muted" className="py-4">
            {refreshing
              ? "Loading the available catalogue…"
              : query.trim()
                ? "No matching objects in the available catalogue."
                : "Search by an object's name or NORAD ID."}
          </FormMessage>
        }
        ListFooterComponent={
          results.length === 50 ? (
            <FormMessage tone="muted" size="xs" className="py-3">
              Showing the first 50 matches. Refine your search to see more.
            </FormMessage>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 border-b border-line py-3">
            <Pressable
              className="min-h-11 flex-1 justify-center active:opacity-60"
              disabled={!item.available}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
              accessibilityState={{ disabled: !item.available }}
              onPress={() => onSelect(item.id)}
            >
              <Text
                className={`text-[15px] font-semibold text-cyan ${item.available ? "" : "opacity-40"}`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                NORAD {item.id} ·{" "}
                {item.available
                  ? OBJECT_LABELS[item.kind]
                  : "Orbital data unavailable"}
              </Text>
            </Pressable>
            <Button
              label={trackedIds.has(item.id) ? "Untrack" : "Track"}
              accessibilityLabel={`${trackedIds.has(item.id) ? "Untrack" : "Track"} ${item.name}`}
              variant="outline"
              disabled={!loaded || saving}
              onPress={() => onToggleTracked(item.id)}
            />
          </View>
        )}
      />
    </Sheet>
  );
}
