import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { formatCoordinates, type Place } from "../model/LocationService";
import { PLACE_NAME_MAX, SEARCH_QUERY_MAX } from "../model/profileValidation";
import type { LocationsBusy } from "../viewmodels/useLocationsViewModel";

type AddLocationSheetProps = {
  visible: boolean;
  busy: LocationsBusy;
  query: string;
  queryError: string | null;
  results: readonly Place[];
  searched: boolean;
  pickedPlace: Place | null;
  name: string;
  nameError: string | null;
  error: string | null;
  searchSource: string | null;
  onClose: () => void;
  onUseCurrentLocation: () => void;
  onChangeQuery: (value: string) => void;
  onSearch: () => void;
  onPickPlace: (place: Place) => void;
  onChangeName: (value: string) => void;
  onSave: () => void;
};

export function AddLocationSheet({
  visible,
  busy,
  query,
  queryError,
  results,
  searched,
  pickedPlace,
  name,
  nameError,
  error,
  searchSource,
  onClose,
  onUseCurrentLocation,
  onChangeQuery,
  onSearch,
  onPickPlace,
  onChangeName,
  onSave,
}: AddLocationSheetProps) {
  const inactive = busy !== null;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close add location"
      eyebrow="Observatory"
      title="Save an observing location"
    >
      <ScrollView
        className="mt-4 shrink"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          <Button
            label="Use my current location"
            onPress={onUseCurrentLocation}
            loading={busy === "locating"}
            disabled={inactive}
            variant="outline"
            tone="cyan"
            size="lg"
          />
          <TextField
            label="Search for a city or address"
            placeholder="City or address"
            value={query}
            maxLength={SEARCH_QUERY_MAX}
            onChangeText={onChangeQuery}
            error={queryError ?? undefined}
            editable={!inactive}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
          <Button
            label="Search"
            onPress={onSearch}
            loading={busy === "searching"}
            disabled={inactive}
            variant="outline"
          />
          <FormMessage
            tone="muted"
            size="xs"
          >{searchSource ? `Search provided by ${searchSource}.` : null}</FormMessage>
          {searched && results.length === 0 ? (
            <FormMessage tone="muted">
              No places found. Try a nearby city or a more complete address.
            </FormMessage>
          ) : null}
          {results.length > 0 ? (
            <View className="gap-2">
              <Label>Choose a place</Label>
              {results.map((place, index) => (
                <Pressable
                  key={`${place.latitude}-${place.longitude}-${index}`}
                  onPress={() => onPickPlace(place)}
                  disabled={inactive}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${place.name}`}
                  accessibilityState={{
                    disabled: inactive,
                    selected: pickedPlace === place,
                  }}
                  className={`min-h-14 gap-1 rounded-2xl border p-4 active:opacity-60 ${pickedPlace === place ? "border-cyan bg-cyan/10" : "border-line bg-space/80"}`}
                >
                  <Text className="text-sm font-semibold text-ink">
                    {place.name}
                  </Text>
                  <Label>{formatCoordinates(place)}</Label>
                </Pressable>
              ))}
            </View>
          ) : null}
          {pickedPlace ? (
            <Card className="gap-4 p-4">
              <View className="gap-1">
                <Label tone="cyan">Selected place</Label>
                <Text className="text-sm leading-6 text-pale">
                  {pickedPlace.name}
                </Text>
                <Label>{formatCoordinates(pickedPlace)}</Label>
              </View>
              <TextField
                label="Location name"
                value={name}
                maxLength={PLACE_NAME_MAX}
                onChangeText={onChangeName}
                error={nameError ?? undefined}
                editable={!inactive}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={onSave}
              />
              <FormMessage tone="muted" size="xs">
                {`Choose a name of up to ${PLACE_NAME_MAX} characters, such as Home or Desert lookout.`}
              </FormMessage>
            </Card>
          ) : null}
          <FormMessage>{error}</FormMessage>
          <Button
            label="Save location"
            onPress={onSave}
            loading={busy === "saving"}
            disabled={inactive || !pickedPlace}
            size="lg"
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
