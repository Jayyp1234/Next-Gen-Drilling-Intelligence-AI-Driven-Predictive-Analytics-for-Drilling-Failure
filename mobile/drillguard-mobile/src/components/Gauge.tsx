import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { C } from "@/lib/theme";

/** Semicircle risk gauge (0–100) coloured by tier. */
export function Gauge({ value, color, label, size = 200 }: { value: number; color: string; label: string; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Semicircle: 180° (left) → 360°/0° (right), sweeping over the top.
  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy + r * Math.sin(rad)).toFixed(2) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const a = polar(fromDeg), b = polar(toDeg);
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
  };
  const endDeg = 180 + (v / 100) * 180;

  return (
    <View style={{ width: size, height: size / 2 + 28, alignItems: "center" }}>
      <Svg width={size} height={size / 2 + 8}>
        <Path d={arc(180, 360)} stroke={C.surface2} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        {v > 0 && <Path d={arc(180, endDeg)} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: C.text }]}>{Math.round(v)}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: "42%", alignItems: "center" },
  value: { fontSize: 40, fontWeight: "800" },
  label: { fontSize: 13, fontWeight: "700", marginTop: 2, letterSpacing: 0.4 },
});
