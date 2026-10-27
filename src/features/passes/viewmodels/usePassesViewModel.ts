import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
    SAMPLE_LOCATIONS,
    SAMPLE_NEXT_PASS,
    SAMPLE_PASSES,
} from "../model/samplePasses";

export const LEAD_TIMES = [
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
  { value: "20", label: "20 min" },
] as const;

export type LeadTime = (typeof LEAD_TIMES)[number]["value"];

export function usePassesViewModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [locationIndex, setLocationIndex] = useState(0);
  const [reminder, setReminder] = useState(true);
  const [leadTime, setLeadTime] = useState<LeadTime>("10");
  const [secondsLeft, setSecondsLeft] = useState(
    SAMPLE_NEXT_PASS.startsInSeconds,
  );

  useEffect(() => {
    const timer = setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  return {
    noradId: id ?? "25544",
    location: SAMPLE_LOCATIONS[locationIndex],
    nextLocation: () =>
      setLocationIndex((current) => (current + 1) % SAMPLE_LOCATIONS.length),
    nextPass: SAMPLE_NEXT_PASS,
    secondsLeft,
    reminder,
    setReminder,
    leadTime,
    setLeadTime,
    upcoming: SAMPLE_PASSES,
  };
}
