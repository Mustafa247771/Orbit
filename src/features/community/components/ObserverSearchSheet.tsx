import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { StateMessage } from "@/components/ui/StateMessage";
import { TextField } from "@/components/ui/TextField";
import type { ObserverView } from "../model/communityViews";

type ObserverSearchSheetProps = {
  visible: boolean;
  query: string;
  results: ObserverView[];
  loading: boolean;
  searched: boolean;
  error: string | null;
  followError: string | null;
  followingReady: boolean;
  onClose: () => void;
  onQuery: (value: string) => void;
  onSearch: () => void;
  onToggleFollow: (uid: string) => void;
};

export function ObserverSearchSheet({
  visible,
  query,
  results,
  loading,
  searched,
  error,
  followError,
  followingReady,
  onClose,
  onQuery,
  onSearch,
  onToggleFollow,
}: ObserverSearchSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close observer search"
      title="Find observers"
      eyebrow="Under the same sky"
    >
      <View className="mt-3 gap-3">
        <TextField
          label="Observer name"
          value={query}
          onChangeText={onQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          error={error ?? undefined}
          placeholder="Search by the start of a name"
        />
        <Button
          label="Search observers"
          icon="search"
          loading={loading}
          onPress={onSearch}
        />
        <FormMessage>{followError}</FormMessage>
      </View>
      <ScrollView
        className="mt-3 shrink"
        contentContainerClassName="gap-4 pb-3"
        keyboardShouldPersistTaps="handled"
      >
        {searched && !results.length ? (
          <StateMessage
            title="No observers found"
            message="Try another name or a shorter spelling."
          />
        ) : null}
        {!searched && !loading && !error ? (
          <Text className="text-sm text-muted">
            Enter at least two characters to find an observer.
          </Text>
        ) : null}
        {results.map((observer) => (
          <View key={observer.uid} className="flex-row items-center gap-3">
            <Avatar initials={observer.initials} size={32} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-ink">
                {observer.name}
              </Text>
              <Label tone={observer.online ? "accent" : "muted"}>
                {observer.online ? "Online now" : observer.rank}
              </Label>
            </View>
            {observer.own ? (
              <Label>You</Label>
            ) : (
              <Button
                label={observer.following ? "Unfollow" : "Follow"}
                accessibilityLabel={`${observer.following ? "Unfollow" : "Follow"} ${observer.name}`}
                disabled={!followingReady}
                variant="outline"
                onPress={() => onToggleFollow(observer.uid)}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}
