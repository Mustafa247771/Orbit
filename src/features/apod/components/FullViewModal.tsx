import { Image } from "expo-image";
import { Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/IconButton";
import type { SpacePicture } from "../model/SpacePicture";

type FullViewModalProps = {
  picture: SpacePicture;
  visible: boolean;
  onClose: () => void;
};

export function FullViewModal({
  picture,
  visible,
  onClose,
}: FullViewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <Image
          source={{ uri: picture.imageUrl }}
          placeholder={{ uri: picture.thumbnailUrl }}
          contentFit="contain"
          accessibilityLabel={picture.title}
          style={{ flex: 1 }}
        />
        <View className="absolute right-5" style={{ top: insets.top + 8 }}>
          <IconButton icon="close" label="Close full view" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
