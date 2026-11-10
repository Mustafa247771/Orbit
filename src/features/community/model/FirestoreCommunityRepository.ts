import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import type {
  CommunityRepository,
  FeedOptions,
  ObserverActivity,
  PublishDraft,
} from "./communityRepository";
import type {
  AuthorSnapshot,
  CommunityPost,
  FeedPage,
  FeedScope,
  Observer,
  PostComment,
  ReportReason,
} from "./communityTypes";
import {
  comparePosts,
  decodeFeedCursor,
  FEED_PAGE_SIZE,
  makeFeedPage,
  makePost,
  todayStart,
} from "./feedPaging";
import { getDb } from "@/core/firebase/firestore";

const COMMENT_LIMIT = 100;
const SEARCH_LIMIT = 20;
const PRESENCE_INTERVAL_MS = 3 * 60 * 1000;

// Module-level so every repository instance shares one throttle.
let lastPresence: { uid: string; key: string; at: number } | null = null;

type StoredPost = Omit<CommunityPost, "id" | "createdAt"> & {
  authorUid: string;
  createdAt: Timestamp | null;
};
type StoredComment = Omit<PostComment, "id" | "createdAt"> & {
  authorUid: string;
  createdAt: Timestamp | null;
};
type StoredObserver = Omit<Observer, "lastActiveAt"> & {
  lastActiveAt: Timestamp | null;
};

function cursorTimestamp(ms: number): Timestamp {
  // Firestore stores microseconds. Restore them after floating-point ms conversion,
  // including when the cursor's post has been deleted. https://firebase.google.com/docs/firestore/manage-data/data-types
  const seconds = Math.floor(ms / 1000);
  const micros = Math.round((ms - seconds * 1000) * 1000);
  return new Timestamp(seconds + Math.floor(micros / 1_000_000), (micros % 1_000_000) * 1000);
}

function readPost(snapshot: DocumentSnapshot): CommunityPost {
  if (!snapshot.exists()) throw Object.assign(new Error("Post not found."), { code: "not-found" });
  const data = snapshot.data() as StoredPost;
  return {
    id: snapshot.id,
    author: data.author,
    sightingId: data.sightingId,
    objectName: data.objectName,
    caption: data.caption,
    photoUrl: data.photoUrl,
    city: data.city,
    latitude: data.latitude,
    longitude: data.longitude,
    cell: data.cell,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    observedAt: data.observedAt,
    starredBy: data.starredBy,
    seenBy: data.seenBy,
    commentCount: data.commentCount,
  };
}

function readComment(snapshot: DocumentSnapshot): PostComment {
  const data = snapshot.data() as StoredComment;
  return {
    id: snapshot.id,
    postId: data.postId,
    author: data.author,
    text: data.text,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
  };
}

function readObserver(snapshot: DocumentSnapshot): Observer {
  const data = snapshot.data() as StoredObserver;
  return {
    uid: snapshot.id,
    name: data.name,
    initials: data.initials,
    rank: data.rank,
    lastActiveAt: data.lastActiveAt?.toMillis() ?? Date.now(),
  };
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  );
}

export class FirestoreCommunityRepository implements CommunityRepository {
  async listPosts(scope: FeedScope, options: FeedOptions): Promise<FeedPage> {
    const values = [...new Set(scope === "nearby" ? options.cells : options.followingUids)];
    if (scope !== "global" && !values.length) return { posts: [], cursor: null };
    const posts = collection(getDb(), "posts");
    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      orderBy(documentId(), "desc"),
      limit(FEED_PAGE_SIZE + 1),
    ];
    const cursor = decodeFeedCursor(options.cursor);
    if (cursor) {
      constraints.push(startAfter(cursorTimestamp(cursor[0]), cursor[1]));
    }
    const chunks: string[][] = [];
    for (let offset = 0; offset < values.length; offset += 30)
      chunks.push(values.slice(offset, offset + 30));
    const queries =
      scope === "global"
        ? [query(posts, ...constraints)]
        : chunks.map((chunk) =>
            query(
              posts,
              where(scope === "nearby" ? "cell" : "authorUid", "in", chunk),
              ...constraints,
            ),
          );
    const snapshots = await Promise.all(queries.map((item) => getDocs(item)));
    const merged = new Map<string, CommunityPost>();
    for (const snapshot of snapshots) {
      for (const item of snapshot.docs) merged.set(item.id, readPost(item));
    }
    return makeFeedPage([...merged.values()].sort(comparePosts));
  }

  async createPost(
    author: AuthorSnapshot,
    draft: PublishDraft,
    id?: string,
  ): Promise<CommunityPost> {
    const db = getDb();
    const reference = id === undefined ? doc(collection(db, "posts")) : doc(db, "posts", id);
    const { id: postId, ...post } = makePost(author, draft, reference.id);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists()) {
        if ((existing.data() as StoredPost).authorUid !== author.uid) {
          throw Object.assign(new Error("Post belongs to another observer."), {
            code: "permission-denied",
          });
        }
        return;
      }
      transaction.set(reference, {
        ...post,
        authorUid: author.uid,
        createdAt: serverTimestamp(),
      });
    });
    return readPost(await getDoc(doc(db, "posts", postId)));
  }

  async deletePost(postId: string): Promise<void> {
    const db = getDb();
    const post = doc(db, "posts", postId);
    // Delete the post first: rules let anyone sweep the comments of a missing post,
    // whereas deleting them one by one under a live post must also lower commentCount.
    await deleteDoc(post);
    try {
      while (true) {
        const comments = await getDocs(query(collection(post, "comments"), limit(400)));
        if (comments.empty) return;
        const batch = writeBatch(db);
        for (const comment of comments.docs) batch.delete(comment.ref);
        await batch.commit();
        if (comments.size < 400) return;
      }
    } catch {
      // The post is gone; leftover comments are unreachable and can be swept later.
    }
  }

  toggleStar(postId: string, uid: string, on: boolean): Promise<void> {
    return updateDoc(doc(getDb(), "posts", postId), {
      starredBy: on ? arrayUnion(uid) : arrayRemove(uid),
    });
  }

  toggleSeen(postId: string, uid: string, on: boolean): Promise<void> {
    return updateDoc(doc(getDb(), "posts", postId), {
      seenBy: on ? arrayUnion(uid) : arrayRemove(uid),
    });
  }

  async listComments(postId: string): Promise<PostComment[]> {
    const snapshot = await getDocs(
      query(
        collection(getDb(), "posts", postId, "comments"),
        orderBy("createdAt", "desc"),
        orderBy(documentId(), "desc"),
        limit(COMMENT_LIMIT),
      ),
    );
    // The newest 100 are fetched; the thread reads oldest-first.
    return snapshot.docs.map(readComment).reverse();
  }

  async addComment(postId: string, author: AuthorSnapshot, text: string): Promise<PostComment> {
    const db = getDb();
    const post = doc(db, "posts", postId);
    const comment = doc(collection(post, "comments"));
    const batch = writeBatch(db);
    batch.set(comment, {
      postId,
      author,
      authorUid: author.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    // Rules require commentCount to rise by exactly one in the same commit.
    batch.update(post, { commentCount: increment(1) });
    await batch.commit();
    return readComment(await getDoc(comment));
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const db = getDb();
    const post = doc(db, "posts", postId);
    const comment = doc(collection(post, "comments"), commentId);
    if (!(await getDoc(comment)).exists()) return;
    // Rules require commentCount to drop by exactly one in the same commit.
    const batch = writeBatch(db);
    batch.delete(comment);
    batch.update(post, { commentCount: increment(-1) });
    await batch.commit();
  }

  async report(
    postId: string,
    reporterUid: string,
    reason: ReportReason,
    note: string,
  ): Promise<void> {
    // The id dedupes: a second report by the same observer would be an update,
    // which rules reject, so treat that denial as "already reported".
    try {
      await setDoc(doc(getDb(), "reports", `${postId}_${reporterUid}`), {
        postId,
        reporterUid,
        reason,
        note: note.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      if (!isPermissionDenied(error)) throw error;
    }
  }

  async listFollowing(uid: string): Promise<string[]> {
    const snapshot = await getDocs(collection(getDb(), "follows", uid, "following"));
    return snapshot.docs.map((item) => item.id);
  }

  async setFollowing(uid: string, otherUid: string, on: boolean): Promise<void> {
    const reference = doc(getDb(), "follows", uid, "following", otherUid);
    if (on) await setDoc(reference, { createdAt: serverTimestamp() });
    else await deleteDoc(reference);
  }

  async recentObservers(count: number): Promise<ObserverActivity> {
    const users = collection(getDb(), "users");
    const size = Math.max(0, Math.floor(count));
    const [observers, active] = await Promise.all([
      size > 0 ? getDocs(query(users, orderBy("lastActiveAt", "desc"), limit(size))) : null,
      getCountFromServer(
        query(users, where("lastActiveAt", ">=", Timestamp.fromMillis(todayStart()))),
      ),
    ]);
    return {
      observers: observers?.docs.map(readObserver) ?? [],
      activeToday: active.data().count,
    };
  }

  async searchObservers(search: string): Promise<Observer[]> {
    const prefix = search.trim().toLowerCase();
    if (!prefix) return [];
    const snapshot = await getDocs(
      query(
        collection(getDb(), "users"),
        orderBy("nameLower"),
        where("nameLower", ">=", prefix),
        where("nameLower", "<=", `${prefix}`),
        limit(SEARCH_LIMIT),
      ),
    );
    return snapshot.docs.map(readObserver);
  }

  async touchPresence(observer: Observer): Promise<void> {
    const fields = {
      uid: observer.uid,
      name: observer.name,
      nameLower: observer.name.trim().toLowerCase(),
      initials: observer.initials,
      rank: observer.rank,
    };
    const key = JSON.stringify(fields);
    const now = Date.now();
    if (
      lastPresence?.uid === observer.uid &&
      lastPresence.key === key &&
      now - lastPresence.at < PRESENCE_INTERVAL_MS
    ) {
      return;
    }
    // Rules require lastActiveAt to equal the server time of this write.
    await setDoc(doc(getDb(), "users", observer.uid), {
      ...fields,
      lastActiveAt: serverTimestamp(),
    });
    lastPresence = { uid: observer.uid, key, at: now };
  }
}
