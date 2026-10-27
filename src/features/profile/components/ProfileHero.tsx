import { View } from "react-native";

import { Label } from "@/components/ui/Label";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { Tag } from "@/components/ui/Tag";
import type { Profile } from "../model/Profile";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileHeroProps = {
  profile: Profile;
  initials: string;
  still: boolean;
  onChangePhoto: () => void;
};

/** Avatar, name, handle and rank tags at the top of the profile. */
export function ProfileHero({
  profile,
  initials,
  still,
  onChangePhoto,
}: ProfileHeroProps) {
  return (
    <View className="mt-5 items-center gap-3 px-5">
      <ProfileAvatar
        initials={initials}
        still={still}
        onChangePhoto={onChangePhoto}
      />
      <ScrambleText
        text={profile.name}
        className="font-display text-[30px] leading-[34px] text-ink"
      />
      <Label>@{profile.handle}</Label>
      <View className="flex-row flex-wrap justify-center gap-2">
        <Tag label={`${profile.rank} · Lv ${profile.level}`} tone="gold" />
        <Tag label={profile.city} />
        <Tag label={`Since ${profile.memberSince}`} />
      </View>
    </View>
  );
}
