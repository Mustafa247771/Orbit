import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  CATALOGUE_MODES,
  type CatalogueMode,
} from "@/core/satellites/catalogueFilters";

type CatalogueModePickerProps = {
  mode: CatalogueMode | null;
  saving: boolean;
  loaded: boolean;
  error: string | null;
  notice?: string | null;
  objectCount: number;
  missingTracked: number;
  refreshing: boolean;
  onChangeMode: (mode: CatalogueMode) => void;
  onOpenSearch: () => void;
  onRetry: () => void;
};

export function CatalogueModePicker({
  mode,
  saving,
  loaded,
  error,
  notice,
  objectCount,
  missingTracked,
  refreshing,
  onChangeMode,
  onOpenSearch,
  onRetry,
}: CatalogueModePickerProps) {
  return (
    <>
      <View className="mt-3 flex-row items-center gap-2">
        <View className="flex-1">
          <SegmentedControl
            label="Objects shown on the globe"
            options={CATALOGUE_MODES}
            value={mode ?? "bright"}
            onChange={(next) => {
              if (!saving) onChangeMode(next);
            }}
          />
        </View>
        <IconButton
          icon="search"
          label="Search orbital objects"
          onPress={onOpenSearch}
        />
      </View>

      <Text className="mt-2 text-[10px] text-muted">
        Green: satellites · Gold: rocket bodies · Pink: debris · Grey: unknown
      </Text>

      {!error && notice && (
        <FormMessage tone="gold" size="xs" className="mt-2">
          {notice}
        </FormMessage>
      )}
      {error && (
        <View className="mt-2 gap-2">
          <FormMessage size="xs">{error}</FormMessage>
          {!loaded && (
            <Button label="Try again" variant="outline" onPress={onRetry} />
          )}
        </View>
      )}

      {mode === "tracked" && !objectCount && !refreshing && (
        <FormMessage tone="muted" className="mt-2">
          Your tracked view is empty. Search for an object to add it.
        </FormMessage>
      )}
      {mode === "tracked" && missingTracked > 0 && (
        <FormMessage tone="gold" size="xs" className="mt-2">
          {`${missingTracked} tracked objects currently have no usable orbital data.`}
        </FormMessage>
      )}
      {mode === "bright" && !objectCount && !refreshing && (
        <FormMessage tone="muted" size="xs" className="mt-2">
          No bright-object records are available in this catalogue.
        </FormMessage>
      )}
    </>
  );
}
