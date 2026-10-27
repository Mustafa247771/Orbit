import { Pressable, Text, View } from "react-native";
import Svg, {
    Circle,
    ClipPath,
    Defs,
    G,
    Path,
    Image as SvgImage,
} from "react-native-svg";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { SpacePicture } from "../model/SpacePicture";

export function ObservatoryHero({ picture }: { picture: SpacePicture }) {
  return (
    <View className="mt-3 overflow-hidden">
      <View className="-mx-3 aspect-square">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          accessible
          accessibilityLabel={picture.title}
        >
          <Defs>
            <ClipPath id="apodLens">
              <Circle cx={200} cy={200} r={176.4} />
            </ClipPath>
          </Defs>

          <SvgImage
            href={{ uri: picture.thumbnailUrl }}
            x={23.6}
            y={23.6}
            width={352.8}
            height={352.8}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#apodLens)"
          />

          <G fill="none" stroke={colors.edge.bright} strokeWidth={0.7}>
            <Circle cx={200} cy={200} r={188} />
            <Circle
              cx={200}
              cy={200}
              r={181}
              stroke={colors.ink}
              opacity={0.15}
              strokeWidth={0.5}
            />
            <Path d="M200 0v17m0 366v17M0 200h17m366 0h17M62 62l10 10m256 256 10 10M62 338l10-10M328 72l10-10" />
            <Path
              d="M13 173A190 190 0 0 1 87 47"
              stroke={colors.cyan}
              strokeWidth={1.2}
            />
            <Circle
              cx={87}
              cy={47}
              r={4}
              fill={colors.cyan}
              stroke={colors.space}
              strokeWidth={2}
            />
          </G>
        </Svg>

        <Pressable
          disabled
          accessibilityLabel="View full picture"
          className="absolute bottom-[12%] right-[11%] h-[40px] w-[40px] items-center justify-center rounded-full border border-pale/40 bg-space/80"
        >
          <Icon name="expand" size={16} />
        </Pressable>
      </View>

      <View className="-mt-[38px] items-center px-6">
        <Text className="bg-space px-3 py-1 text-[10px] tracking-[0.7px] text-cyan">
          NASA image library
        </Text>
        <Text
          accessibilityRole="header"
          className="mt-2 text-center font-display text-[45px] leading-[45px] tracking-[-2px] text-ink"
        >
          {picture.title}
        </Text>
        <Text className="mt-3 text-center text-[11px] text-haze">
          {picture.credit} · {picture.year}
        </Text>
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-3">
        <Pressable
          disabled
          className="h-[46px] w-[166px] flex-row items-center justify-center gap-2 rounded-full bg-ice"
        >
          <Icon name="bookmark" size={17} color={colors.deep} />
          <Text className="text-[12px] font-semibold text-deep">
            Save picture
          </Text>
        </Pressable>
        <Pressable
          disabled
          accessibilityLabel="Share picture"
          className="h-[46px] w-[46px] items-center justify-center rounded-full border border-edge-bright bg-shade"
        >
          <Icon name="share" size={18} color={colors.pale} />
        </Pressable>
      </View>
    </View>
  );
}
