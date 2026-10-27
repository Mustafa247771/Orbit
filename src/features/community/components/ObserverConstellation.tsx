import { View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import colors from "@/theme/colors";
import type { Observer } from "../model/Post";

const POINTS = [
  { x: 54, y: 84, tint: colors.violet },
  { x: 142, y: 38, tint: colors.cyan },
  { x: 235, y: 78, tint: colors.rose.light },
  { x: 310, y: 29, tint: colors.mint },
];

type ObserverConstellationProps = {
  observers: readonly Observer[];
  moreObservers: number;
};

/** Up to four observers drawn as stars joined by dotted lines, plus a "+N more" count. */
export function ObserverConstellation({
  observers,
  moreObservers,
}: ObserverConstellationProps) {
  const visible = observers.slice(0, POINTS.length);
  const more = moreObservers + Math.max(0, observers.length - POINTS.length);

  return (
    <View className="mx-5 mt-4 aspect-[360/154]">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 154"
        accessible
        accessibilityLabel={`Community observers: ${visible
          .map((observer) => observer.name)
          .join(", ")}`}
      >
        <G fill="none" stroke={colors.edge.DEFAULT} strokeWidth={0.8}>
          <Path d="M-12 132Q180-21 372 132" />
          <Path d="M-12 143Q180 4 372 143" opacity={0.35} />
          <Path
            d="M54 84 142 38 235 78 310 29"
            stroke={colors.violet}
            strokeOpacity={0.5}
            strokeDasharray="2 5"
          />
          <Path
            d="M54 84 235 78M142 38 310 29"
            strokeDasharray="2 5"
            opacity={0.4}
          />
          <Path d="M190 13v8m-4-4h8M17 40v6m-3-3h6" stroke={colors.haze} />
        </G>

        {visible.map((observer, index) => {
          const point = POINTS[index];

          return (
            <G
              key={observer.id}
              transform={`translate(${point.x}, ${point.y})`}
            >
              <Circle r={25} fill={colors.space} />
              <Circle
                r={20}
                fill={point.tint}
                fillOpacity={0.16}
                stroke={point.tint}
                strokeOpacity={0.5}
              />
              <SvgText
                y={4}
                textAnchor="middle"
                fontSize={11}
                fontFamily="SpaceGrotesk_600SemiBold"
                fill={point.tint}
              >
                {observer.initials}
              </SvgText>

              {observer.online && (
                <Circle
                  cx={14}
                  cy={14}
                  r={4}
                  fill={colors.mint}
                  stroke={colors.space}
                  strokeWidth={2}
                />
              )}

              <SvgText
                y={37}
                textAnchor="middle"
                fontSize={10}
                fill={colors.haze}
              >
                {observer.name}
              </SvgText>
            </G>
          );
        })}

        {more > 0 && (
          <SvgText
            x={180}
            y={150}
            textAnchor="middle"
            fontSize={9}
            fill={colors.mist}
          >
            +{more} more
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
