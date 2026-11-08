import {
    FlatList,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { OBJECT_LABELS } from "@/core/satellites/CatalogueRepository";
import { CATALOGUE_MODES } from "@/core/satellites/TrackingRepository";
import colors from "@/theme/colors";
import type { useEarthViewModel } from "../viewmodels/useEarthViewModel";

type Props = {
  vm: ReturnType<typeof useEarthViewModel>;
};

export function SatelliteBrowser({ vm }: Props) {
  return (
    <>
      <View className="mt-3 flex-row items-center gap-2">
        <View className="flex-1">
          <SegmentedControl
            label="Objects shown on the globe"
            options={CATALOGUE_MODES}
            value={vm.catalogueMode ?? "bright"}
            onChange={(mode) => {
              if (!vm.savingTracking) void vm.changeMode(mode);
            }}
          />
        </View>

        <IconButton
          icon="search"
          label="Search orbital objects"
          onPress={() => vm.setSearchOpen(true)}
        />
      </View>

      <Text className="mt-2 text-[10px] text-muted">
        Green: satellites · Gold: rocket bodies · Pink: debris · Grey: unknown
      </Text>

      {vm.preferenceError && (
        <View className="mt-2 gap-2">
          <Text accessibilityRole="alert" className="text-xs text-danger">
            {vm.preferenceError}
          </Text>

          {!vm.preferencesLoaded && (
            <Button
              label="Try again"
              variant="outline"
              onPress={vm.retrySatellites}
            />
          )}
        </View>
      )}

      {vm.catalogueMode === "tracked" &&
        !vm.satellites.length &&
        !vm.refreshing && (
          <Text className="mt-2 text-sm text-muted">
            Your tracked view is empty. Search for an object to add it.
          </Text>
        )}

      {vm.catalogueMode === "tracked" && vm.missingTracked > 0 && (
        <Text className="mt-2 text-xs text-gold">
          {vm.missingTracked} tracked objects currently have no usable orbital
          data.
        </Text>
      )}

      {vm.catalogueMode === "bright" &&
        !vm.satellites.length &&
        !vm.refreshing && (
          <Text className="mt-2 text-xs text-muted">
            No bright-object records are available in this catalogue.
          </Text>
        )}

      <Modal
        visible={vm.preferencesLoaded && vm.catalogueMode === null}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View className="flex-1 justify-center bg-black/70 px-5">
          <View className="gap-4 rounded-3xl border border-line bg-surface p-6">
            <Text className="font-display text-2xl text-ink">
              Choose your orbital view
            </Text>

            <Text className="text-sm leading-5 text-muted">
              You can change this on the globe whenever you like.
            </Text>

            {CATALOGUE_MODES.map((mode) => (
              <Button
                key={mode.value}
                label={
                  mode.value === "bright"
                    ? "Bright objects worldwide"
                    : mode.label
                }
                variant="outline"
                disabled={vm.savingTracking}
                onPress={() => {
                  void vm.changeMode(mode.value);
                }}
              />
            ))}

            {vm.preferenceError && (
              <Text accessibilityRole="alert" className="text-sm text-danger">
                {vm.preferenceError}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      <Sheet
        visible={vm.searchOpen}
        onClose={() => vm.setSearchOpen(false)}
        closeLabel="Close object search"
        eyebrow="Orbital catalogue"
        title="Find and track an object"
      >
        <TextInput
          value={vm.query}
          onChangeText={vm.setQuery}
          maxLength={80}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search by name or NORAD ID"
          placeholder="Name or NORAD ID"
          placeholderTextColor={colors.muted}
          className="mb-3 mt-4 h-12 rounded-2xl border border-line bg-space px-4 text-base text-ink"
        />

        {vm.preferenceError && (
          <Text accessibilityRole="alert" className="mb-2 text-xs text-danger">
            {vm.preferenceError}
          </Text>
        )}

        <FlatList
          style={{ height: 320, flexShrink: 1 }}
          data={vm.searchResults}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text className="py-4 text-sm text-muted">
              {vm.refreshing
                ? "Loading the available catalogue…"
                : vm.query.trim()
                  ? "No matching objects in the available catalogue."
                  : "Search by an object's name or NORAD ID."}
            </Text>
          }
          ListFooterComponent={
            vm.searchResults.length === 50 ? (
              <Text className="py-3 text-xs text-muted">
                Showing the first 50 matches. Refine your search to see more.
              </Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 border-b border-line py-3">
              <Pressable
                className="flex-1"
                accessibilityRole="button"
                accessibilityLabel={"View " + item.name}
                disabled={!item.available}
                onPress={() => vm.selectFromSearch(item.id)}
              >
                <Text
                  numberOfLines={1}
                  className="text-sm font-semibold text-ink"
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

              <Pressable
                disabled={!vm.preferencesLoaded || vm.savingTracking}
                accessibilityRole="button"
                accessibilityLabel={
                  (vm.trackedIds.has(item.id) ? "Untrack " : "Track ") +
                  item.name
                }
                accessibilityState={{
                  disabled: !vm.preferencesLoaded || vm.savingTracking,
                }}
                onPress={() => {
                  void vm.toggleTracked(item.id);
                }}
                className="min-h-11 justify-center rounded-full border border-accent/40 px-3 active:opacity-60"
              >
                <Text className="text-xs text-accent">
                  {vm.trackedIds.has(item.id) ? "Untrack" : "Track"}
                </Text>
              </Pressable>
            </View>
          )}
        />
      </Sheet>
    </>
  );
}
