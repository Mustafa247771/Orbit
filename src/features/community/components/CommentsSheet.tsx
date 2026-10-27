import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Sheet } from "@/components/ui/Sheet";
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
    <Sheet
      visible={post !== null}
      onClose={onClose}
      closeLabel="Close comments"
      eyebrow={post ? `Comments · ${post.comments.length}` : undefined}
      title={post ? `${post.author.name} · ${post.object}` : undefined}
    >
      {post ? (
        <>
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
        </>
      ) : null}
    </Sheet>
  );
}
