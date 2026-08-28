import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";
import { useReplay } from "@/lib/replay";
import { useDerived, fmt } from "@/lib/derive";
import { C } from "@/lib/theme";
import { Card, SectionLabel } from "@/components/ui";

const g = (v: number | null, lo: number, hi: number) => (v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo))));

export default function Performance() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();
  const d = useDerived();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
        <View>
          <Text style={styles.title}>Performance</Text>
          <Text style={styles.sub}>{d ? `Measured · ${d.well}` : "No well loaded"}</Text>
        </View>
      </View>

      {!d ? (
        <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={30} color={C.muted2} /><Text style={styles.emptyText}>Load a replay dataset to see measured performance.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
          {/* KPI grid */}
          <View style={styles.grid}>
            <Kpi label="Avg ROP" value={d.avg.rop != null ? d.avg.rop.toFixed(0) : "—"} unit="ft/hr" />
            <Kpi label="On-Bottom" value={d.onBottomPct.toFixed(0)} unit="%" tone={C.good} />
            <Kpi label="Interval Drilled" value={fmt(d.footageFt)} unit="ft" />
            <Kpi label="Drilling Time" value={d.days >= 1 ? d.days.toFixed(1) : d.hours.toFixed(1)} unit={d.days >= 1 ? "days" : "hrs"} tone={C.primary} />
            <Kpi label="Avg MSE" value={d.avg.mse != null ? fmt(d.avg.mse) : "—"} unit="psi" tone={C.medium} />
            <Kpi label="Peak Tier" value={d.maxTier} />
          </View>

          {/* ROP by depth */}
          {d.ropBins.length > 1 && (
            <Card>
              <SectionLabel>ROP vs Depth · ft/hr</SectionLabel>
              <RopBars bins={d.ropBins} />
              <View style={styles.axisRow}>
                <Text style={styles.axis}>{fmt(d.ropBins[0].depthFt)} ft</Text>
                <Text style={styles.axis}>{fmt(d.ropBins[d.ropBins.length - 1].depthFt)} ft</Text>
              </View>
            </Card>
          )}

          {/* Parameters */}
          <Card>
            <SectionLabel>Drilling Parameters · period average</SectionLabel>
            <Param name="ROP" v={d.avg.rop} unit="ft/hr" lo={30} hi={120} />
            <Param name="Weight on Bit" v={d.avg.wob} unit="klbs" lo={20} hi={50} />
            <Param name="Torque" v={d.avg.torque} unit="ft-lb" lo={0} hi={15000} />
            <Param name="Standpipe Pressure" v={d.avg.spp} unit="psi" lo={0} hi={5000} />
            <Param name="Rotary Speed" v={d.avg.rpm} unit="rpm" lo={0} hi={200} />
            <Param name="Mud Flow Rate" v={d.avg.flow} unit="gpm" lo={0} hi={900} />
          </Card>

          {/* Daily log */}
          {d.daily.length > 0 && (
            <Card>
              <SectionLabel>Reconstructed Daily Log · Σ dz/ROP</SectionLabel>
              <View style={styles.logHead}>
                <Text style={[styles.logCell, { flex: 1.1 }]}>Day</Text>
                <Text style={[styles.logCell, styles.num]}>Depth</Text>
                <Text style={[styles.logCell, styles.num]}>Footage</Text>
                <Text style={[styles.logCell, styles.num]}>ROP</Text>
              </View>
              {d.daily.map((row) => (
                <View key={row.day} style={styles.logRow}>
                  <View style={{ flex: 1.1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.dot, { backgroundColor: row.onPlan ? C.good : C.medium }]} />
                    <Text style={styles.logVal}>Day {row.day}</Text>
                  </View>
                  <Text style={[styles.logVal, styles.num]}>{fmt(row.depthFt)}</Text>
                  <Text style={[styles.logVal, styles.num]}>{fmt(row.footageFt)} ft</Text>
                  <Text style={[styles.logVal, styles.num]}>{row.rop}</Text>
                </View>
              ))}
              <Text style={styles.note}>{d.daily.length} reconstructed drilling day{d.daily.length === 1 ? "" : "s"} · {r.dataset?.labelTier}</Text>
            </Card>
          )}
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

function Param({ name, v, unit, lo, hi }: { name: string; v: number | null; unit: string; lo: number; hi: number }) {
  const pct = Math.round(g(v, lo, hi) * 100);
  return (
    <View style={styles.param}>
      <View style={styles.paramTop}>
        <Text style={styles.paramName}>{name}</Text>
        <Text style={styles.paramVal}>{v != null ? fmt(v) : "—"}<Text style={styles.paramUnit}> {unit}</Text></Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
    </View>
  );
}

function RopBars({ bins }: { bins: { depthFt: number; rop: number }[] }) {
  const W = 300, H = 90, max = Math.max(...bins.map((b) => b.rop), 1);
  const bw = W / bins.length;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {bins.map((b, i) => {
        const h = (b.rop / max) * (H - 6);
        return <Rect key={i} x={i * bw + 1} y={H - h} width={bw - 2} height={h} rx={1.5} fill={C.primary} opacity={0.85} />;
      })}
    </Svg>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "47.8%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  kpiLabel: { fontSize: 12, color: C.muted },
  kpiValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  kpiUnit: { fontSize: 12, fontWeight: "600", color: C.muted },
  axisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  axis: { fontSize: 11, color: C.muted2 },
  param: { paddingVertical: 8 },
  paramTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  paramName: { fontSize: 13.5, color: C.text2, fontWeight: "600" },
  paramVal: { fontSize: 13.5, fontWeight: "800", color: C.text },
  paramUnit: { fontSize: 11.5, fontWeight: "600", color: C.muted },
  track: { height: 7, borderRadius: 4, backgroundColor: C.surface2, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4, backgroundColor: C.primary },
  logHead: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  logCell: { flex: 1, fontSize: 11, color: C.muted, fontWeight: "600" },
  logRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  logVal: { flex: 1, fontSize: 13, color: C.text, fontWeight: "600" },
  num: { textAlign: "right" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  note: { fontSize: 12, color: C.muted, marginTop: 10 },
});
