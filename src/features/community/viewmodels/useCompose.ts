import { useRef, useState } from "react";

import type { SavedLocation } from "@/features/profile/model/Profile";
import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { AuthorSnapshot, CommunityPost, PostDraft } from "../model/communityTypes";
import { MAX_PHOTO_BYTES, photoUploadAvailable, uploadPostPhoto } from "../model/PhotoUploader";
import {
  canPostAgain,
  POST_COOLDOWN_MS,
  validatePostDraft,
  type PostErrors,
} from "../model/postValidation";
import { usePhotoPicker } from "./usePhotoPicker";
import { useResetOnUid } from "./useResetOnUid";

const lastPosts = new Map<string, number>();
type Session = { id: string; photoUrl: string | null };
const newSession = (): Session => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
  photoUrl: null,
});

export function useCompose(
  author: AuthorSnapshot | null,
  location: SavedLocation | null,
  onCreated: (post: CommunityPost) => void,
) {
  const [visible, setVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const [objectName, setObjectName] = useState("");
  const [errors, setErrors] = useState<PostErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const session = useRef<Session | null>(null);
  const generationRef = useRef(0);
  const picker = usePhotoPicker(guard, generationRef, setError, () => {
    if (session.current) session.current.photoUrl = null;
  });
  const photosAvailable = photoUploadAvailable();
  const reset = () => {
    session.current = null;
    setVisible(false);
    setCaption("");
    setObjectName("");
    setErrors({});
    setError(null);
    picker.reset();
  };
  useResetOnUid(
    author?.uid,
    () => {
      reset();
      setNotice(null);
      guard.current = false;
      setBusy(false);
    },
    generationRef,
  );
  const close = () => {
    if (!guard.current) reset();
  };
  const open = () => {
    if (guard.current) return;
    session.current ??= newSession();
    setError(null);
    setErrors({});
    setNotice(null);
    setVisible(true);
  };

  const submit = async () => {
    if (guard.current) return;
    const draft: PostDraft = {
      caption: caption.trim(),
      objectName: objectName.trim(),
      ...(location
        ? { city: location.name, latitude: location.latitude, longitude: location.longitude }
        : {}),
    };
    const nextErrors = validatePostDraft(draft);
    setErrors(nextErrors);
    setError(null);
    if (Object.keys(nextErrors).length) return;
    if (!author) {
      setError("Sign in to share a sighting.");
      return;
    }
    const last = lastPosts.get(author.uid) ?? null;
    if (!canPostAgain(last, Date.now())) {
      const seconds = Math.ceil((POST_COOLDOWN_MS - (Date.now() - (last ?? 0))) / 1000);
      setError(`Wait ${seconds} seconds before sharing another post.`);
      return;
    }
    const asset = picker.asset;
    if (asset?.fileSize !== undefined && asset.fileSize > MAX_PHOTO_BYTES) {
      setError("That photo is too large to upload. Choose a smaller one.");
      return;
    }
    if (asset && !photosAvailable) {
      setError("Add your Cloudinary settings to share photos.");
      return;
    }
    const current = (session.current ??= newSession());
    const token = generationRef.current;
    guard.current = true;
    setBusy(true);
    try {
      if (asset && !current.photoUrl)
        current.photoUrl = await uploadPostPhoto(asset.uri, asset.fileSize);
      if (token !== generationRef.current) return;
      const post = await communityRepository.createPost(
        author,
        { ...draft, photoUrl: current.photoUrl },
        current.id,
      );
      lastPosts.set(author.uid, Date.now());
      if (token !== generationRef.current) return;
      onCreated(post);
      reset();
      setNotice("Sighting shared with the community.");
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      if (token === generationRef.current) {
        guard.current = false;
        setBusy(false);
      }
    }
  };

  return {
    visible,
    open,
    close,
    caption,
    objectName,
    photoUri: picker.asset?.uri ?? null,
    errors,
    error,
    notice,
    busy,
    picking: picker.picking,
    photosAvailable,
    setCaption: (value: string) => {
      setCaption(value);
      setErrors((current) => ({ ...current, caption: undefined }));
    },
    setObjectName: (value: string) => {
      setObjectName(value);
      setErrors((current) => ({ ...current, objectName: undefined }));
    },
    removePhoto: () => {
      if (guard.current) return;
      picker.reset();
      if (session.current) session.current.photoUrl = null;
    },
    takePhoto: () => {
      if (photosAvailable) void picker.pick(true);
    },
    choosePhoto: () => {
      if (photosAvailable) void picker.pick(false);
    },
    submit: () => {
      void submit();
    },
  };
}
