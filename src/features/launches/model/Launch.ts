export type Launch = {
  id: string;
  name: string;
  provider: string;
  rocket: string;
  mission: string;
  missionType: string;
  description: string;
  net: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  statusAbbreviation: string;
  location: string;
  pad: string;
  imageUrl: string | null;
  imageCredit: string | null;
  webcastLive: boolean;
};
