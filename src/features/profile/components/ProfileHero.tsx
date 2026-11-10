import { View } from "react-native";

import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { Tag } from "@/components/ui/Tag";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileHeroProps = {
  name: string;
  handle: string;
  initials: string;
  rank: string;
  city: string | null;
  since: string | null;
  still: boolean;
  photoUri?: string | null;
  photoBusy?: boolean;
  photoError?: string | null;
  onChangePhoto: () => void;
};

/** Avatar, name, handle and rank tags at the top of the profile. */
export function ProfileHero({
  name,
  handle,
  initials,
  rank,
  city,
  since,
  still,
  photoUri = null,
  photoBusy = false,
  photoError = null,
  onChangePhoto,
}: ProfileHeroProps) {
  return (
    <View className="mt-5 items-center gap-3 px-5">
      <ProfileAvatar
        initials={initials}
        still={still}
        photoUri={photoUri}
        photoBusy={photoBusy}
        onChangePhoto={onChangePhoto}
      />
      <FormMessage>{photoError}</FormMessage>
      <ScrambleText
        text={name}
        className="font-display text-[30px] leading-[34px] text-ink"
      />
      <Label>@{handle}</Label>
      <View className="flex-row flex-wrap justify-center gap-2">
        <Tag label={rank} tone="gold" />
        {city ? <Tag label={city} /> : null}
        {since ? <Tag label={`Since ${since}`} /> : null}
      </View>
    </View>
  );
}
