import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { C, sevColor, sevSoft, type Sev } from "@/lib/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Badge({ sev, children }: { sev: Sev; children: React.ReactNode }) {
  return (
    <View style={[styles.badge, { backgroundColor: sevSoft[sev] }]}>
      <Text style={[styles.badgeText, { color: sevColor[sev] }]}>{children}</Text>
    </View>
  );
}

export function Pill({ children, color = C.primary, bg = C.primarySoft }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

export function KV({ k, v, vStyle }: { k: string; v: string; vStyle?: TextStyle }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={[styles.kvVal, vStyle]}>{v}</Text>
    </View>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: C.muted, textTransform: "uppercase", marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "700" },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7 },
  kvKey: { fontSize: 13, color: C.text2 },
  kvVal: { fontSize: 13, fontWeight: "700", color: C.text },
  stat: { flex: 1 },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 18, fontWeight: "800", color: C.text, marginTop: 2 },
  statUnit: { fontSize: 12, fontWeight: "600", color: C.muted },
});
