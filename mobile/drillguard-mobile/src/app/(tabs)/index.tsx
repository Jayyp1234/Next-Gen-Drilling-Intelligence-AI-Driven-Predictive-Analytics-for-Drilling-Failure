import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useReplay } from "@/lib/replay";
import { C, riskStatus, type Tier } from "@/lib/theme";
import { Gauge } from "@/components/Gauge";
import { Card, SectionLabel, Pill } from "@/components/ui";

const SPEEDS = [1, 3, 10];

function param(ch: Record<string, number | undefined>, key: string, unit: string, dp = 0) {
  const v = ch[key];
  return v == null ? "—" : `${v.toLocaleString(undefined, { maximumFractionDigits: dp })} ${unit}`;
}

export default function LiveMonitoring() {
  const r = useReplay();
  const insets = useSafeAreaInsets();
  const cur = r.current;
  const tier = (cur?.tier ?? "Normal") as Tier;
  const risk = cur?.risk ?? 0;
  const status = riskStatus(Math.round(risk), tier);
  const lead = r.anchorLead;

  if (r.loading || !r.dataset) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.primary} />
        <Text style={styles.dim}>{r.dataset ? "Loading well…" : "Connecting to backend…"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Monitoring</Text>
          <Text style={styles.subtitle}>{r.dataset.well} · {r.dataset.field}</Text>
        </View>
        <Pill color={C.primary} bg={C.primarySoft}>REPLAY</Pill>
      </View>

      <Card style={{ marginHorizontal: 16, alignItems: "center", paddingVertical: 22 }}>
        <SectionLabel>Drilling Risk Score</SectionLabel>
        <Gauge value={risk} color={status.color} label={status.label.toUpperCase()} size={210} />
        <Text style={styles.depth}>
          {r.dataset.units.indexLabel} {cur ? r.fmtIdx(cur.idx) : "—"} · monitors {cur?.active?.split("|").join(" + ") || "—"}
        </Text>
      </Card>

      {lead && (
        <View style={[styles.leadBanner, { backgroundColor: lead.leadM != null ? C.goodSoft : C.surface2 }]}>
          <Ionicons name={lead.leadM != null ? "flag" : "flag-outline"} size={16} color={lead.leadM != null ? C.good : C.muted} />
          <Text style={[styles.leadText, { color: lead.leadM != null ? C.good : C.muted }]}>
            {lead.leadM != null ? `${lead.via} warned ${lead.leadM} m before ${lead.anchorId}` : `Documented event ahead: ${lead.anchorId}`}
          </Text>
        </View>
      )}

      {/* Transport */}
      <Card style={{ marginHorizontal: 16, marginTop: 12 }}>
        <View style={styles.transport}>
          <Pressable onPress={() => r.seek(0)} style={styles.tBtn}><Ionicons name="play-skip-back" size={18} color={C.text2} /></Pressable>
          <Pressable onPress={() => (r.playing ? r.pause() : r.play())} style={[styles.tBtn, styles.tPlay]}>
            <Ionicons name={r.playing ? "pause" : "play"} size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={r.jumpToEvent} style={[styles.tBtn, styles.tEvent]}>
            <Ionicons name="flag" size={15} color={C.high} />
            <Text style={styles.tEventText}>Jump to event</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={styles.speeds}>
            {SPEEDS.map((s) => (
              <Pressable key={s} onPress={() => r.setSpeed(s)} style={[styles.speed, s === r.speed && styles.speedOn]}>
                <Text style={[styles.speedText, s === r.speed && { color: "#fff" }]}>{s}×</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${r.rows.length ? (r.cursor / (r.rows.length - 1)) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>row {r.cursor + 1} / {r.rows.length}</Text>
      </Card>

      {/* Live parameters */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <SectionLabel>Live Parameters</SectionLabel>
        <View style={styles.grid}>
          {[
            { label: "ROP", v: param(cur?.ch ?? {}, "rop", "ft/hr") },
            { label: "Weight on Bit", v: param(cur?.ch ?? {}, "wob", "klbs") },
            { label: "Torque", v: param(cur?.ch ?? {}, "torque", "ft-lb") },
            { label: "Standpipe", v: param(cur?.ch ?? {}, "spp", "psi") },
            { label: "Flow", v: param(cur?.ch ?? {}, "flow", "gpm") },
            { label: "Rotary", v: param(cur?.ch ?? {}, "rpm", "rpm") },
          ].map((p) => (
            <Card key={p.label} style={styles.gridCell}>
              <Text style={styles.pLabel}>{p.label}</Text>
              <Text style={styles.pValue}>{p.v}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg, gap: 10 },
  dim: { color: C.muted, fontSize: 13 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: C.text },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  depth: { fontSize: 12, color: C.muted, marginTop: 8, textAlign: "center" },
  leadBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12 },
  leadText: { fontSize: 13, fontWeight: "700", flex: 1 },
  transport: { flexDirection: "row", alignItems: "center", gap: 8 },
  tBtn: { height: 40, minWidth: 40, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 10, gap: 6 },
  tPlay: { backgroundColor: C.primary, borderColor: C.primary },
  tEvent: { backgroundColor: C.highSoft, borderColor: "#f6c9c7" },
  tEventText: { color: C.high, fontSize: 12, fontWeight: "700" },
  speeds: { flexDirection: "row", gap: 4, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 3 },
  speed: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  speedOn: { backgroundColor: C.primary },
  speedText: { fontSize: 12, fontWeight: "600", color: C.text2 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: C.surface2, marginTop: 14, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: C.primary },
  progressText: { fontSize: 11, color: C.muted, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: { width: "47.8%", padding: 14 },
  pLabel: { fontSize: 12, color: C.muted },
  pValue: { fontSize: 17, fontWeight: "800", color: C.text, marginTop: 4 },
});
