import Svg, { Circle, Ellipse, G } from "react-native-svg";

import colors from "@/theme/colors";

/** Small violet planet-and-orbit mark beside the Community title. */
export function CommunityEmblem() {
  return (
    <Svg width={39} height={39} viewBox="0 0 40 40">
      <G fill="none" stroke={colors.violet} strokeWidth={0.8}>
        <Ellipse cx={20} cy={20} rx={18} ry={8} rotation={-43} origin="20,20" />
        <Circle cx={20} cy={20} r={11} />
        <Circle
          cx={32}
          cy={8}
          r={3}
          fill={colors.violet}
          stroke={colors.space}
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
}
