import { Image } from "expo-image";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { CAPTION_MAX, type PostErrors } from "../model/postValidation";

const OBJECTS = ["ISS", "Starlink train", "Moon", "Planet"];

type ComposeSheetProps = {
  visible: boolean;
  caption: string;
  objectName: string;
  photoUri: string | null;
  photosAvailable: boolean;
  busy: boolean;
  picking: boolean;
  errors: PostErrors;
  error: string | null;
  onClose: () => void;
  onCaption: (value: string) => void;
  onObjectName: (value: string) => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  onSubmit: () => void;
};

export function ComposeSheet({
  visible,
  caption,
  objectName,
  photoUri,
  photosAvailable,
  busy,
  picking,
  errors,
  error,
  onClose,
  onCaption,
  onObjectName,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  onSubmit,
}: ComposeSheetProps) {
  const inactive = busy || picking;
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close compose"
      title="Share a sighting"
      eyebrow="The shared sky"
    >
      <ScrollView
        className="mt-3 shrink"
        contentContainerClassName="gap-4 pb-3"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row flex-wrap gap-2">
          {OBJECTS.map((object) => (
            <Button
              key={object}
              label={object}
              variant={objectName === object ? "solid" : "outline"}
              tone="cyan"
              disabled={inactive}
              onPress={() => onObjectName(object)}
            />
          ))}
        </View>
        <TextField
          label="Object"
          value={objectName}
          onChangeText={onObjectName}
          editable={!inactive}
          error={errors.objectName}
          placeholder="What did you observe?"
          autoCapitalize="words"
        />
        <TextField
          label="Caption"
          value={caption}
          onChangeText={onCaption}
          editable={!inactive}
          error={errors.caption}
          placeholder="Tell us what you saw"
          multiline
          autoCapitalize="sentences"
        />
        <Label
          tone={caption.trim().length > CAPTION_MAX ? "danger" : "muted"}
        >{`${caption.trim().length}/${CAPTION_MAX}`}</Label>
        {photosAvailable ? (
          <View className="gap-3">
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                className="aspect-[4/3] w-full rounded-2xl"
                contentFit="cover"
                accessibilityLabel="Attached sighting photo"
              />
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              <Button
                label="Camera"
                icon="camera"
                variant="outline"
                disabled={inactive}
                onPress={onTakePhoto}
              />
              <Button
                label="Photo library"
                icon="photo"
                variant="outline"
                disabled={inactive}
                onPress={onChoosePhoto}
              />
              {photoUri ? (
                <Button
                  label="Remove photo"
                  tone="danger"
                  variant="ghost"
                  disabled={inactive}
                  onPress={onRemovePhoto}
                />
              ) : null}
            </View>
          </View>
        ) : null}
        <FormMessage>{error}</FormMessage>
        <FormMessage tone="muted">
          {picking ? "Opening photos…" : null}
        </FormMessage>
        <Button
          label="Share sighting"
          icon="send"
          loading={busy}
          disabled={picking}
          onPress={onSubmit}
        />
      </ScrollView>
    </Sheet>
  );
}
