import type { Comment, Observer, Post } from "./Post";

const MINUTE_MS = 60_000;

const nasaPhoto = (id: string) =>
  `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg`;

// Sample feed until the community backend exists. The photos are NASA's own ISS pass shots.
export function samplePosts(now: number): Post[] {
  const ago = (minutes: number) =>
    new Date(now - minutes * MINUTE_MS).toISOString();
  const comment = (
    id: string,
    author: string,
    initials: string,
    text: string,
    minutes: number,
  ): Comment => ({ id, author, initials, text, postedAt: ago(minutes) });

  return [
    {
      id: "p1",
      author: { name: "Layla H.", initials: "LH", rank: "Navigator" },
      city: "Cape Canaveral, US",
      postedAt: ago(120),
      object: "ISS · Zarya",
      caption:
        "Long, bright pass right over the launch pad. Six minutes from horizon to horizon.",
      photoUri: nasaPhoto("NHQ202204080031"),
      photoCredit: "NASA",
      pass: null,
      details: "Max 71° · 20:14 · Naked eye",
      verified: true,
      stars: 124,
      seenBy: 9,
      comments: [
        comment("c1", "Omar S.", "OS", "That pad in the frame is perfect.", 95),
        comment(
          "c2",
          "Sofia L.",
          "SL",
          "Saw the same pass from the beach!",
          80,
        ),
        comment("c3", "Mariam K.", "MK", "Clouds here, so jealous.", 41),
      ],
      nearby: false,
      following: true,
    },
    {
      id: "p2",
      author: { name: "Omar S.", initials: "OS", rank: "Orbiter" },
      city: "Alexandria, EG",
      postedAt: ago(300),
      object: "Starlink train",
      caption:
        "Counted 21 satellites in a single line, about ten minutes after sunset.",
      photoUri: null,
      photoCredit: null,
      pass: { maxElevation: 41, rises: "NW", sets: "SE" },
      details: "Max 41° · 18:52 · Naked eye",
      verified: false,
      stars: 47,
      seenBy: 8,
      comments: [
        comment("c4", "Layla H.", "LH", "Did they fade one by one?", 250),
      ],
      nearby: true,
      following: true,
    },
    {
      id: "p3",
      author: { name: "Mariam K.", initials: "MK", rank: "Orbiter" },
      city: "Cairo, EG",
      postedAt: ago(540),
      object: "ISS · Zarya",
      caption:
        "Caught it from the rooftop between the clouds. It faded into Earth’s shadow before reaching the east.",
      photoUri: null,
      photoCredit: null,
      pass: { maxElevation: 58, rises: "W", sets: "E" },
      details: "Max 58° · 19:31 · Naked eye",
      verified: true,
      stars: 31,
      seenBy: 4,
      comments: [],
      nearby: true,
      following: false,
    },
    {
      id: "p4",
      author: { name: "Daniel R.", initials: "DR", rank: "Cadet" },
      city: "Arlington, US",
      postedAt: ago(1440),
      object: "ISS · Zarya",
      caption:
        "Long exposure from the riverbank. The streak is the whole visible pass.",
      photoUri: nasaPhoto("NHQ202012070001"),
      photoCredit: "NASA",
      pass: null,
      details: "Max 48° · 17:39 · Tripod",
      verified: true,
      stars: 212,
      seenBy: 15,
      comments: [
        comment("c5", "Layla H.", "LH", "How long was the exposure?", 1300),
      ],
      nearby: false,
      following: false,
    },
    {
      id: "p5",
      author: { name: "Sofia L.", initials: "SL", rank: "Navigator" },
      city: "Florida, US",
      postedAt: ago(2880),
      object: "ISS · Zarya",
      caption: "Watched it glide over the space center right after dusk.",
      photoUri: nasaPhoto("NHQ202104240001"),
      photoCredit: "NASA",
      pass: null,
      details: "Max 62° · 20:02 · Naked eye",
      verified: true,
      stars: 88,
      seenBy: 6,
      comments: [],
      nearby: false,
      following: true,
    },
  ];
}

export const OBSERVERS: Observer[] = [
  { id: "o1", name: "Layla", initials: "LH", online: true },
  { id: "o2", name: "Omar", initials: "OS", online: true },
  { id: "o3", name: "Mariam", initials: "MK", online: false },
  { id: "o4", name: "Youssef", initials: "YA", online: false },
];

export const MORE_OBSERVERS = 33;
export const OBSERVERS_UNDER_CLEAR_SKIES = 38;
