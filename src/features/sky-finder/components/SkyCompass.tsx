import { Text, View } from "react-native";
import Svg, {
    Circle,
    G,
    Line,
    Path,
    Rect,
    Text as SvgText,
} from "react-native-svg";

import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";

const SIZE = 290;
const MID = SIZE / 2;
const TRACK = 105;
const ARROW_LIMIT = 70;

const CARDINALS = [
  { label: "N", x: MID, y: 22 },
  { label: "E", x: SIZE - 16, y: MID + 4 },
  { label: "S", x: MID, y: SIZE - 12 },
  { label: "W", x: 16, y: MID + 4 },
];

// Arrow from the centre toward the target, drawn pointing straight up.
const ARROW = `M${MID} ${MID - 58} L${MID + 10} ${MID - 36} L${MID + 3} ${MID - 36} L${MID + 3} ${MID - 16} L${MID - 3} ${MID - 16} L${MID - 3} ${MID - 36} L${MID - 10} ${MID - 36} Z`;

type SkyCompassProps = {
  pointerAngle: number;
  aligned: boolean;
  guidance: string;
  targetElevation: string;
};

/** Compass ring: the ISS marker sits where to turn, the arrow says which way. */
export function SkyCompass({
  pointerAngle,
  aligned,
  guidance,
  targetElevation,
}: SkyCompassProps) {
  const tint = aligned ? colors.accent : colors.cyan;
  const arrowAngle = Math.max(
    -ARROW_LIMIT,
    Math.min(ARROW_LIMIT, pointerAngle),
  );

  return (
    <View className="mt-6 items-center">
      <Svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        accessible
        accessibilityLabel={guidance}
      >
        <Circle
          cx={MID}
          cy={MID}
          r={MID - 1}
          fill="none"
          stroke={colors.line}
        />
        <Circle
          cx={MID}
          cy={MID}
          r={TRACK}
          fill="none"
          stroke={colors.cyan}
          strokeOpacity={0.3}
          strokeDasharray="4 6"
        />
        <Circle cx={MID} cy={MID} r={61} fill="none" stroke={colors.line} />
        <Line
          x1={MID - 61}
          y1={MID}
          x2={MID + 61}
          y2={MID}
          stroke={colors.cyan}
          strokeOpacity={0.3}
        />
        <Line
          x1={MID}
          y1={MID - 61}
          x2={MID}
          y2={MID + 61}
          stroke={colors.cyan}
          strokeOpacity={0.3}
        />
        {CARDINALS.map((point) => (
          <SvgText
            key={point.label}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            fontFamily="JetBrainsMono_500Medium"
            fontSize={12}
            fill={colors.muted}
          >
            {point.label}
          </SvgText>
        ))}

        <G rotation={pointerAngle} origin={`${MID}, ${MID}`}>
          <Rect
            x={MID - 4}
            y={MID - TRACK - 10}
            width={8}
            height={20}
            rx={2}
            fill={colors.ink}
          />
          <Rect
            x={MID - 19}
            y={MID - TRACK - 6}
            width={13}
            height={12}
            rx={2}
            fill={colors.cyan}
          />
          <Rect
            x={MID + 6}
            y={MID - TRACK - 6}
            width={13}
            height={12}
            rx={2}
            fill={colors.cyan}
          />
        </G>

        <G rotation={arrowAngle} origin={`${MID}, ${MID}`}>
          <Path d={ARROW} fill={tint} />
        </G>
        <Circle
          cx={MID}
          cy={MID}
          r={9}
          fill="none"
          stroke={tint}
          strokeWidth={2}
        />
        <Circle cx={MID} cy={MID} r={3} fill={tint} />
      </Svg>

      <View className="-mt-4">
        <Tag label={`ISS · ${targetElevation}`} tone="cyan" />
      </View>

      <View
        className={`mx-5 mt-4 flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${aligned ? "border-accent/60 bg-accent/10" : "border-cyan/50 bg-cyan/10"}`}
      >
        <View
          className={`h-1.5 w-1.5 rounded-full ${aligned ? "bg-accent" : "bg-cyan"}`}
        />
        <Text
          className={`shrink text-[13px] font-semibold ${aligned ? "text-accent" : "text-cyan"}`}
        >
          {guidance}
        </Text>
      </View>
    </View>
  );
}
