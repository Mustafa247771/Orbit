import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import colors from "@/theme/colors";
import type { PostView } from "../viewmodels/useCommunityViewModel";

type CommentsSheetProps = {
  post: PostView | null;
  onClose: () => void;
  onSend: (postId: string, text: string) => void;
};

export function CommentsSheet({ post, onClose, onSend }: CommentsSheetProps) {
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!post || !draft.trim()) return;
    onSend(post.id, draft);
    setDraft("");
  };

  return (
    <Modal
      visible={post !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close comments"
          className="absolute inset-0 bg-black/60"
        />
        {post ? (
          <SafeAreaView
            edges={["bottom"]}
            className="max-h-[75%] rounded-t-[32px] border-t border-line bg-surface px-5 pb-3 pt-3"
          >
            <View className="h-1.5 w-10 self-center rounded-full bg-line" />
            <View className="mt-3 flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-0.5">
                <Text className="font-mono text-[11px] uppercase tracking-[2px] text-muted">
                  Comments · {post.comments.length}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-base font-semibold text-ink"
                >
                  {post.author.name} · {post.object}
                </Text>
              </View>
              <IconButton
                icon="close"
                label="Close comments"
                onPress={onClose}
              />
            </View>

            <ScrollView
              className="mt-3 shrink"
              contentContainerClassName="gap-4 pb-2"
            >
              {post.comments.length === 0 ? (
                <Text className="text-sm text-muted">
                  No comments yet. Be the first to wish clear skies.
                </Text>
              ) : (
                post.comments.map((comment) => (
                  <View key={comment.id} className="flex-row gap-3">
                    <Avatar initials={comment.initials} size={32} />
                    <View className="flex-1 gap-1">
                      <Text className="text-[13px] font-semibold text-ink">
                        {comment.author}
                        <Text className="font-normal text-muted">
                          {" "}
                          · {comment.ago}
                        </Text>
                      </Text>
                      <Text className="text-sm leading-5 text-ink/90">
                        {comment.text}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View className="mt-3 flex-row items-center gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={send}
                returnKeyType="send"
                placeholder="Add a comment"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Comment"
                className="h-11 flex-1 rounded-full border border-line bg-space/60 px-4 text-[15px] text-ink"
              />
              <IconButton icon="send" label="Send comment" onPress={send} />
            </View>
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
