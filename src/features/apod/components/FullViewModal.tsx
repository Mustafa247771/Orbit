import { Image } from "expo-image";
import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          className="flex-1"
        />
        <SafeAreaView
          edges={["top"]}
          pointerEvents="box-none"
          className="absolute right-5 top-0 pt-2"
        >
          <IconButton icon="close" label="Close full view" onPress={onClose} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
