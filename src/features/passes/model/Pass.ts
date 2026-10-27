export type PassQuality = "Good" | "Fair";

/** One predicted pass over the observer's location. */
export type Pass = {
  id: string;
  day: string;
  time: string;
  direction: string;
  duration: string;
  elevation: string;
  quality: PassQuality;
};

/** The next pass, shown big with a countdown. */
export type NextPass = {
  conditions: string;
  time: string;
  period: string;
  when: string;
  startsInSeconds: number;
  visible: string;
  maxElevation: string;
  clouds: string;
};
