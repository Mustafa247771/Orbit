import type { NextPass, Pass } from "./Pass";

export const SAMPLE_LOCATIONS = [
  "Cairo, Egypt",
  "Alexandria, Egypt",
  "New Cairo, Egypt",
];

export const SAMPLE_NEXT_PASS: NextPass = {
  conditions: "Good conditions",
  time: "7:42",
  period: "PM",
  when: "Tonight · Northwest → Southeast",
  startsInSeconds: 1 * 3600 + 18 * 60 + 32,
  visible: "6 min",
  maxElevation: "64°",
  clouds: "12%",
};

export const SAMPLE_PASSES: Pass[] = [
  {
    id: "p1",
    day: "Tomorrow",
    time: "5:18 AM",
    direction: "West → Northeast",
    duration: "4 min",
    elevation: "42°",
    quality: "Good",
  },
  {
    id: "p2",
    day: "Wed 23",
    time: "8:31 PM",
    direction: "Southwest → East",
    duration: "3 min",
    elevation: "27°",
    quality: "Fair",
  },
  {
    id: "p3",
    day: "Fri 25",
    time: "6:54 PM",
    direction: "Northwest → Southeast",
    duration: "5 min",
    elevation: "58°",
    quality: "Good",
  },
];
