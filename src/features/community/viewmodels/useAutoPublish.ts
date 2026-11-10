import { useFocusEffect } from "expo-router";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { sightingRepository } from "@/features/sightings/model/LocalSightingRepository";
import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { AuthorSnapshot, CommunityPost } from "../model/communityTypes";
import { photoUploadAvailable, uploadPostPhoto } from "../model/PhotoUploader";
import { validatePostDraft } from "../model/postValidation";
import { markPublished, unpublishedSightings } from "../model/publishLedger";
import { sightingToPostDraft } from "../model/sightingToPostDraft";
import { useResetOnUid } from "./useResetOnUid";

type Published = { posts: CommunityPost[]; notice: string | null };
// Reuse the job if a focus effect replays or the user returns during an upload.
const publishing = new Map<string, Promise<Published>>();

async function publishSightings(author: AuthorSnapshot): Promise<Published> {
  const posts: CommunityPost[] = [];
  let failed = 0;
  let invalid = 0;
  let missingSettings = false;
  try {
    const sightings = await unpublishedSightings(author.uid, await sightingRepository.list());
    for (const sighting of sightings) {
      try {
        const { photoUri, ...draft } = sightingToPostDraft(sighting);
        if (Object.keys(validatePostDraft(draft)).length) {
          invalid++;
          continue;
        }
        if (photoUri && !photoUploadAvailable()) {
          missingSettings = true;
          continue;
        }
        const photoUrl = photoUri ? await uploadPostPhoto(photoUri) : null;
        const post = await communityRepository.createPost(
          author,
          { ...draft, photoUrl },
          sighting.id,
        );
        await markPublished(author.uid, sighting.id, post.id);
        posts.push(post);
      } catch {
        // Leave failures out of the ledger so the next focus retries them.
        failed++;
      }
    }
  } catch (failure) {
    return { posts, notice: communityErrorMessage(failure) };
  }
  const notices = [
    missingSettings ? "Add your Cloudinary settings to share photo sightings." : null,
    failed
      ? `${failed} ${failed === 1 ? "sighting couldn't" : "sightings couldn't"} be shared. Try again.`
      : null,
    invalid
      ? `${invalid} ${invalid === 1 ? "sighting needs" : "sightings need"} a valid object name and caption before sharing.`
      : null,
  ];
  return { posts, notice: notices.filter(Boolean).join(" ") || null };
}

export function useAutoPublish(
  author: AuthorSnapshot | null,
  onPublished: (post: CommunityPost) => void,
) {
  const [notice, setNotice] = useState<string | null>(null);
  const generationRef = useResetOnUid(author?.uid, () => setNotice(null));
  const latest = useRef(onPublished);
  useLayoutEffect(() => {
    latest.current = onPublished;
  }, [onPublished]);
  useFocusEffect(
    useCallback(() => {
      if (!author) return;
      let cancelled = false;
      const token = generationRef.current;
      let job = publishing.get(author.uid);
      if (!job) {
        job = publishSightings(author).finally(() => publishing.delete(author.uid));
        publishing.set(author.uid, job);
      }
      void job
        .then((result) => {
          if (cancelled || token !== generationRef.current) return;
          setNotice(result.notice);
          for (const post of result.posts) latest.current(post);
        })
        .catch((failure: unknown) => {
          if (!cancelled && token === generationRef.current)
            setNotice(communityErrorMessage(failure));
        });
      return () => {
        cancelled = true;
      };
    }, [author, generationRef]),
  );
  return { notice };
}
