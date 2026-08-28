import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReplay } from "@/lib/replay";
import { useDerived, fmt } from "@/lib/derive";
import { C } from "@/lib/theme";
import { Card, SectionLabel, KV } from "@/components/ui";

// Stated assumptions for the ESTIMATED figures (labelled on-screen).
const RIG_FUEL_L_PER_DAY = 4000;   // typical land-rig diesel burn
const DIESEL_CO2_KG_PER_L = 2.68;  // DEFRA/EPA diesel combustion factor

const BREAKDOWN = [
  { label: "Fuel Combustion", pct: 56.0, color: C.good },
  { label: "Drilling Operations", pct: 22.4, color: C.primary },
  { label: "Power Generation", pct: 12.6, color: "#7c3aed" },
  { label: "Flaring", pct: 5.2, color: C.medium },
  { label: "Other", pct: 3.8, color: C.muted2 },
];

export default function Sustainability() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();
  const d = useDerived();
  const ok = d && d.isDepth && d.footageFt > 0;

  const fuelL = ok ? d!.days * RIG_FUEL_L_PER_DAY : 0;
  const co2t = (fuelL * DIESEL_CO2_KG_PER_L) / 1000;
  const kFt = ok ? d!.footageFt / 1000 : 1;
  const co2Int = co2t / kFt;
  const fuelInt = fuelL / kFt;
  const score = ok ? Math.round(Math.min(100, 40 + d!.onBottomPct * 0.6)) : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
        <View>
          <Text style={styles.title}>Sustainability</Text>
          <Text style={styles.sub}>{ok ? "Estimated from measured activity" : "No well loaded"}</Text>
        </View>
      </View>

      {!ok ? (
        <View style={styles.empty}><Ionicons name="leaf-outline" size={30} color={C.muted2} /><Text style={styles.emptyText}>Load a depth-indexed well to estimate emissions from drilling activity.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
          <View style={styles.estBanner}>
            <Ionicons name="information-circle-outline" size={16} color={C.muted} />
            <Text style={styles.estText}>Estimated from measured footage &amp; drilling days × published factors ({RIG_FUEL_L_PER_DAY.toLocaleString()} L/day · {DIESEL_CO2_KG_PER_L} kg CO₂/L). Not a measured emissions ledger.</Text>
          </View>

          <View style={styles.grid}>
            <Kpi label="Est. CO₂e" value={co2t.toFixed(1)} unit="tCO₂e" tone={C.good} />
            <Kpi label="Est. Fuel Use" value={fmt(Math.round(fuelL))} unit="L" tone={C.primary} />
            <Kpi label="CO₂ Intensity" value={co2Int.toFixed(2)} unit="t/kft" tone={C.good} />
            <Kpi label="Efficiency Score" value={String(score)} unit="/100" tone={C.good} />
          </View>

          <Card>
            <SectionLabel>Estimated Emissions Breakdown · tCO₂e</SectionLabel>
            <Text style={styles.centerNum}>{co2t.toFixed(1)}<Text style={styles.centerUnit}> tCO₂e (est.)</Text></Text>
            {BREAKDOWN.map((b) => (
              <View key={b.label} style={styles.brRow}>
                <View style={styles.brTop}>
                  <Text style={styles.brLabel}>{b.label}</Text>
                  <Text style={styles.brVal}>{(co2t * b.pct / 100).toFixed(1)} · {b.pct}%</Text>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${b.pct}%`, backgroundColor: b.color }]} /></View>
              </View>
            ))}
          </Card>

          <Card>
            <SectionLabel>Key Indicators (estimated / measured)</SectionLabel>
            <KV k="CO₂ Intensity — est." v={`${co2Int.toFixed(2)} t/kft`} />
            <KV k="Fuel Efficiency — est." v={`${fmt(Math.round(fuelInt))} L/kft`} />
            <KV k="On-Bottom — measured" v={`${d!.onBottomPct.toFixed(0)}%`} vStyle={{ color: C.good }} />
            <KV k="Avg MSE — measured" v={d!.avg.mse != null ? `${fmt(d!.avg.mse)} psi` : "—"} />
            <KV k="Interval Drilled — measured" v={`${fmt(d!.footageFt)} ft`} />
            <KV k="Drilling Time — reconstructed" v={d!.days >= 1 ? `${d!.days.toFixed(1)} days` : `${d!.hours.toFixed(1)} h`} />
          </Card>

          <Text style={styles.note}>Efficiency, MSE and footage are MEASURED from the replay. CO₂/fuel are ESTIMATES — less idle rig time (higher on-bottom %) means less wasted diesel. Well: {r.dataset?.well}.</Text>
        </ScrollView>
      )}
    </View>
  );
}

function Kpi({ label, value, unit, tone = C.text }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]} numberOfLines={1}>{value}{unit ? <Text style={styles.kpiUnit}> {unit}</Text> : null}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 30 },
  emptyText: { color: C.muted, textAlign: "center", fontSize: 14 },
  estBanner: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: C.surface2, borderRadius: 12, padding: 12 },
  estText: { flex: 1, fontSize: 12, color: C.text2, lineHeight: 17 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "47.8%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  kpiLabel: { fontSize: 12, color: C.muted },
  kpiValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  kpiUnit: { fontSize: 12, fontWeight: "600", color: C.muted },
  centerNum: { fontSize: 24, fontWeight: "800", color: C.text, marginBottom: 10 },
  centerUnit: { fontSize: 13, fontWeight: "600", color: C.muted },
  brRow: { paddingVertical: 7 },
  brTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  brLabel: { fontSize: 13, color: C.text2, fontWeight: "600" },
  brVal: { fontSize: 12.5, fontWeight: "700", color: C.text },
  track: { height: 7, borderRadius: 4, backgroundColor: C.surface2, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  note: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
