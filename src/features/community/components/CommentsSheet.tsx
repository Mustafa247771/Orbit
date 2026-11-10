import { ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { StateMessage } from "@/components/ui/StateMessage";
import { TextField } from "@/components/ui/TextField";
import { COMMENT_MAX } from "../model/commentValidation";
import type { CommentView } from "../model/communityViews";

type CommentsSheetProps = {
  visible: boolean;
  comments: CommentView[];
  text: string;
  loading: boolean;
  busy: boolean;
  error: string | null;
  inputError: string | null;
  onClose: () => void;
  onChangeText: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
};

export function CommentsSheet({
  visible,
  comments,
  text,
  loading,
  busy,
  error,
  inputError,
  onClose,
  onChangeText,
  onAdd,
  onDelete,
  onRetry,
}: CommentsSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close comments"
      title="Comments"
      eyebrow="The conversation"
    >
      <ScrollView
        className="mt-3 shrink"
        contentContainerClassName="gap-4 pb-4"
        keyboardShouldPersistTaps="handled"
      >
        {loading ? <StateMessage loading message="Loading comments…" /> : null}
        {error ? <StateMessage message={error} onRetry={onRetry} /> : null}
        {!loading && !error && !comments.length ? (
          <Text className="text-sm text-muted">
            No comments yet. Share a thought about this sighting.
          </Text>
        ) : null}
        {comments.map((comment) => (
          <View key={comment.id} className="flex-row items-start gap-3">
            <Avatar initials={comment.author.initials} size={32} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-ink">
                {comment.author.name}
              </Text>
              <Label>{comment.ago}</Label>
              <Text className="text-sm leading-5 text-ink/90">
                {comment.text}
              </Text>
              {comment.own ? (
                <Button
                  label="Delete comment"
                  variant="ghost"
                  tone="danger"
                  disabled={busy}
                  className="self-start px-0"
                  onPress={() => onDelete(comment.id)}
                />
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="gap-2">
        <TextField
          label="Comment"
          value={text}
          onChangeText={onChangeText}
          multiline
          autoCapitalize="sentences"
          editable={!busy}
          error={inputError ?? undefined}
          placeholder="Add a comment"
        />
        <Label
          tone={text.trim().length > COMMENT_MAX ? "danger" : "muted"}
        >{`${text.trim().length}/${COMMENT_MAX}`}</Label>
        <FormMessage tone="muted">
          {busy ? "Sending your comment…" : null}
        </FormMessage>
        <Button
          label="Send comment"
          icon="send"
          loading={busy}
          disabled={loading}
          onPress={onAdd}
        />
      </View>
    </Sheet>
  );
}
