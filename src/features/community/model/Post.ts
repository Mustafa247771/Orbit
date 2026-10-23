export type Comment = {
  id: string;
  author: string;
  initials: string;
  text: string;
  postedAt: string;
};

export type PassTraceData = {
  maxElevation: number;
  rises: string;
  sets: string;
};

export type Post = {
  id: string;
  author: { name: string; initials: string; rank: string };
  city: string;
  postedAt: string;
  object: string;
  caption: string;
  photoUri: string | null;
  photoCredit: string | null;
  pass: PassTraceData | null;
  details: string;
  verified: boolean;
  stars: number;
  seenBy: number;
  comments: Comment[];
  nearby: boolean;
  following: boolean;
};

export type Observer = {
  id: string;
  name: string;
  initials: string;
  online: boolean;
};
