import React from "react";
import { View } from "react-native";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * Money — coin/bill icons with denomination labels.
 * AI returns: { currency: "EUR", items: [{ value: 1, count: 3 }, { value: 0.5, count: 2 }] }
 * Coins for value < 5, bills for value >= 5.
 */
export type MoneyProps = {
  currency?: "EUR" | "USD" | "GBP";
  items: { value: number; count: number }[];
  size?: number;
};

const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };

export function Money({ currency = "EUR", items, size = 36 }: MoneyProps) {
  const symbol = SYMBOL[currency] ?? "€";
  const flat: { value: number; isBill: boolean }[] = [];
  for (const item of items) {
    const isBill = item.value >= 5;
    for (let i = 0; i < item.count; i++) flat.push({ value: item.value, isBill });
  }

  const perRow = 5;
  const rows = Math.ceil(flat.length / perRow);
  const billW = size * 1.8;
  const gap = size * 0.2;
  const cellW = Math.max(size, billW) + gap;
  const cellH = size + gap;
  const width = perRow * cellW;
  const height = rows * cellH;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {flat.map((m, i) => {
          const col = i % perRow;
          const row = Math.floor(i / perRow);
          const cx = col * cellW + cellW / 2;
          const cy = row * cellH + cellH / 2;
          const label = m.value < 1 ? `${Math.round(m.value * 100)}¢` : `${symbol}${m.value}`;

          if (m.isBill) {
            return (
              <React.Fragment key={i}>
                <Rect
                  x={cx - billW / 2}
                  y={cy - size / 2}
                  width={billW}
                  height={size}
                  rx={4}
                  fill={C.success}
                  stroke={C.successDark}
                  strokeWidth={1.5}
                />
                <SvgText
                  x={cx}
                  y={cy + 5}
                  fontFamily={F.bodyBold}
                  fontSize={size * 0.42}
                  fill={C.surface}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={i}>
              <Circle
                cx={cx}
                cy={cy}
                r={size / 2}
                fill={C.yellow}
                stroke={C.yellowDeep}
                strokeWidth={1.5}
              />
              <SvgText
                x={cx}
                y={cy + 5}
                fontFamily={F.bodyBold}
                fontSize={size * 0.42}
                fill={C.yellowDeep}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default Money;
