import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polyline, Line } from "react-native-svg";
import { useReplay } from "@/lib/replay";
import { useDerived, fmt } from "@/lib/derive";
import { C } from "@/lib/theme";
import { Card, SectionLabel, KV, Badge } from "@/components/ui";

export default function WellHistory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();
  const d = useDerived();

  const phase = !d ? "" : d.maxTier === "Action" ? "AT RISK" : d.maxTier === "Normal" ? "DRILLING" : "MONITORING";
  const daysStr = !d ? "" : d.days >= 1 ? `${d.days.toFixed(1)} days` : `${d.hours.toFixed(1)} h`;

  // Events = documented anchors + fired model alerts.
  const events: { title: string; meta: string; sev: "high" | "medium" | "low" }[] = [];
  for (const a of r.dataset?.anchors ?? []) events.push({ title: `${a.id} — documented`, meta: `${r.fmtIdx(a.eventIdx)} · ${a.mechanism.replace(/_/g, " ")}`, sev: "high" });
  for (const a of r.alerts.slice(0, 6)) events.push({ title: a.title, meta: `${a.at} · model alert`, sev: a.sev });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
        <View>
          <Text style={styles.title}>Well History</Text>
          <Text style={styles.sub}>{d ? `${d.well} · ${d.field}` : "No well loaded"}</Text>
        </View>
      </View>

      {!d ? (
        <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={30} color={C.muted2} /><Text style={styles.emptyText}>Load a replay dataset to see the well record.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
          {/* Banner */}
          <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wellName}>{d.well}</Text>
              <Text style={styles.wellMeta}>{d.field}</Text>
            </View>
            <Badge sev={phase === "DRILLING" ? "low" : phase === "AT RISK" ? "high" : "medium"}>{phase}</Badge>
          </Card>

          {/* Summary */}
          <Card>
            <SectionLabel>Well Summary</SectionLabel>
            <KV k="Total Depth (MD)" v={`${fmt(d.hiFt)} ft`} />
            <KV k="Interval Drilled" v={`${fmt(d.footageFt)} ft`} />
            <KV k="Drilling Time" v={daysStr} />
            <KV k="On-Bottom Time" v={`${d.onBottomPct.toFixed(0)}%`} />
            <KV k="Mechanism Watched" v={d.mechanism.replace(/_/g, " ")} />
            <KV k="Avg ROP" v={d.avg.rop != null ? `${d.avg.rop.toFixed(0)} ft/hr` : "—"} />
            <KV k="Data Tier" v={r.dataset?.labelTier ?? "—"} />
          </Card>

          {/* Depth profile */}
          {d.depthCurve.length > 2 && (
            <Card>
              <SectionLabel>Depth Profile · MD vs drilling time</SectionLabel>
              <DepthChart curve={d.depthCurve} />
              <View style={styles.axisRow}>
                <Text style={styles.axis}>0 h</Text>
                <Text style={styles.axis}>{fmt(d.hiFt)} ft @ {d.hours.toFixed(0)} h</Text>
              </View>
            </Card>
          )}

          {/* Integrity */}
          <Card>
            <SectionLabel>Integrity & Risk</SectionLabel>
            <KV k="Peak Risk Tier" v={d.maxTier} vStyle={{ color: d.maxTier === "Normal" ? C.good : d.maxTier === "Action" ? C.high : C.medium }} />
            <KV k="Mean Risk Score" v={`${d.meanRisk.toFixed(0)} / 100`} />
            <KV k="Documented Events" v={String(r.dataset?.anchors.length ?? 0)} />
          </Card>

          {/* Events */}
          <Card>
            <SectionLabel>Events</SectionLabel>
            {events.length === 0 ? (
              <Text style={styles.note}>No events yet — play the replay to surface model alerts.</Text>
            ) : events.map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <View style={[styles.eDot, { backgroundColor: e.sev === "high" ? C.high : e.sev === "medium" ? C.medium : C.low }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eTitle} numberOfLines={1}>{e.title}</Text>
                  <Text style={styles.eMeta}>{e.meta}</Text>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

function DepthChart({ curve }: { curve: { h: number; depthFt: number }[] }) {
  const W = 300, H = 120;
  const maxH = curve[curve.length - 1].h || 1;
  const minD = Math.min(...curve.map((p) => p.depthFt));
  const maxD = Math.max(...curve.map((p) => p.depthFt), minD + 1);
  const pts = curve
    .filter((_, i) => i % Math.max(1, Math.floor(curve.length / 60)) === 0)
    .map((p) => `${(p.h / maxH) * W},${((p.depthFt - minD) / (maxD - minD)) * (H - 8) + 4}`)
    .join(" ");
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f) => <Line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke={C.border} strokeWidth={0.5} />)}
      <Polyline points={pts} fill="none" stroke={C.primary} strokeWidth={2.2} strokeLinejoin="round" />
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
  wellName: { fontSize: 18, fontWeight: "800", color: C.text },
  wellMeta: { fontSize: 13, color: C.muted, marginTop: 2 },
  axisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  axis: { fontSize: 11, color: C.muted2 },
  note: { fontSize: 13, color: C.muted, paddingVertical: 4 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  eDot: { width: 8, height: 8, borderRadius: 4 },
  eTitle: { fontSize: 13.5, fontWeight: "600", color: C.text },
  eMeta: { fontSize: 11.5, color: C.muted, marginTop: 2 },
});
