import { readJson, writeJson } from "@/core/storage/jsonFile";
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
  makeFeedPage,
  makePost,
  todayStart,
} from "./feedPaging";

type LocalReport = {
  id: string;
  postId: string;
  reporterUid: string;
  reason: ReportReason;
  note: string;
  createdAt: number;
};
type LocalData = {
  posts: CommunityPost[];
  comments: PostComment[];
  following: Record<string, string[]>;
  observers: Observer[];
  reports: LocalReport[];
};

const fileName = "community-local.json";
let pending: Promise<unknown> = Promise.resolve();
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

async function readData(): Promise<LocalData> {
  return (
    ((await readJson(fileName)) as LocalData | null) ?? {
      posts: [],
      comments: [],
      following: {},
      observers: [],
      reports: [],
    }
  );
}

// Shared across repository instances; a rejected write must not poison the queue.
function change<T>(update: (data: LocalData) => T): Promise<T> {
  const result = pending.then(async () => {
    const data = await readData();
    const value = update(data);
    await writeJson(fileName, data);
    return value;
  });
  pending = result.catch(() => undefined);
  return result;
}

async function read(): Promise<LocalData> {
  await pending;
  return readData();
}

function requirePost(data: LocalData, postId: string): CommunityPost {
  const post = data.posts.find((item) => item.id === postId);
  if (!post) throw Object.assign(new Error("Post not found."), { code: "not-found" });
  return post;
}

export class LocalCommunityRepository implements CommunityRepository {
  async listPosts(scope: FeedScope, options: FeedOptions): Promise<FeedPage> {
    const cursor = decodeFeedCursor(options.cursor);
    const data = await read();
    const posts = data.posts.filter((post) => {
      if (scope === "nearby" && (!post.cell || !options.cells?.includes(post.cell))) return false;
      if (scope === "following" && !options.followingUids?.includes(post.author.uid)) return false;
      return (
        !cursor ||
        post.createdAt < cursor[0] ||
        (post.createdAt === cursor[0] && post.id < cursor[1])
      );
    });
    return makeFeedPage(posts.sort(comparePosts));
  }

  createPost(author: AuthorSnapshot, draft: PublishDraft, id = newId()): Promise<CommunityPost> {
    return change((data) => {
      const existing = data.posts.find((post) => post.id === id);
      if (existing) {
        if (existing.author.uid !== author.uid) {
          throw Object.assign(new Error("Post belongs to another observer."), {
            code: "permission-denied",
          });
        }
        return existing;
      }
      const post = makePost(author, draft, id);
      data.posts.push(post);
      return post;
    });
  }

  deletePost(postId: string): Promise<void> {
    return change((data) => {
      data.posts = data.posts.filter((post) => post.id !== postId);
      data.comments = data.comments.filter((comment) => comment.postId !== postId);
    });
  }

  toggleStar(postId: string, uid: string, on: boolean): Promise<void> {
    return this.toggle(postId, uid, on, "starredBy");
  }

  toggleSeen(postId: string, uid: string, on: boolean): Promise<void> {
    return this.toggle(postId, uid, on, "seenBy");
  }

  private toggle(
    postId: string,
    uid: string,
    on: boolean,
    field: "starredBy" | "seenBy",
  ): Promise<void> {
    return change((data) => {
      const post = requirePost(data, postId);
      post[field] = on
        ? [...new Set([...post[field], uid])]
        : post[field].filter((value) => value !== uid);
    });
  }

  async listComments(postId: string): Promise<PostComment[]> {
    return (await read()).comments
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id === b.id ? 0 : 1));
  }

  addComment(postId: string, author: AuthorSnapshot, text: string): Promise<PostComment> {
    return change((data) => {
      const post = requirePost(data, postId);
      const comment: PostComment = {
        id: newId(),
        postId,
        author,
        text: text.trim(),
        createdAt: Date.now(),
      };
      data.comments.push(comment);
      post.commentCount += 1;
      return comment;
    });
  }

  deleteComment(postId: string, commentId: string): Promise<void> {
    return change((data) => {
      const existing = data.comments.find(
        (comment) => comment.postId === postId && comment.id === commentId,
      );
      if (!existing) return;
      data.comments = data.comments.filter((comment) => comment !== existing);
      const post = data.posts.find((item) => item.id === postId);
      if (post) post.commentCount = Math.max(0, post.commentCount - 1);
    });
  }

  report(postId: string, reporterUid: string, reason: ReportReason, note: string): Promise<void> {
    return change((data) => {
      const id = `${postId}_${reporterUid}`;
      data.reports = data.reports.filter((item) => item.id !== id);
      data.reports.push({
        id,
        postId,
        reporterUid,
        reason,
        note: note.trim(),
        createdAt: Date.now(),
      });
    });
  }

  async listFollowing(uid: string): Promise<string[]> {
    return (await read()).following[uid] ?? [];
  }

  setFollowing(uid: string, otherUid: string, on: boolean): Promise<void> {
    return change((data) => {
      const following = data.following[uid] ?? [];
      data.following[uid] = on
        ? [...new Set([...following, otherUid])]
        : following.filter((value) => value !== otherUid);
    });
  }

  async recentObservers(limit: number): Promise<ObserverActivity> {
    const { observers } = await read();
    return {
      observers: [...observers]
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
        .slice(0, Math.max(0, Math.floor(limit))),
      activeToday: observers.filter((observer) => observer.lastActiveAt >= todayStart()).length,
    };
  }

  async searchObservers(query: string): Promise<Observer[]> {
    const prefix = query.trim().toLowerCase();
    if (!prefix) return [];
    return (await read()).observers
      .filter((observer) => observer.name.trim().toLowerCase().startsWith(prefix))
      .sort((a, b) => {
        const left = a.name.trim().toLowerCase();
        const right = b.name.trim().toLowerCase();
        return left < right ? -1 : left === right ? 0 : 1;
      });
  }

  touchPresence(observer: Observer): Promise<void> {
    return change((data) => {
      data.observers = data.observers.filter((item) => item.uid !== observer.uid);
      data.observers.push({ ...observer, lastActiveAt: Date.now() });
    });
  }
}
