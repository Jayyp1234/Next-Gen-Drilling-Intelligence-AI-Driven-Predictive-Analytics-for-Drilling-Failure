import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polyline, Line } from "react-native-svg";
import { C, tierColor } from "@/lib/theme";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { inferEnabled, MODELS, modelCard, scoreSample, type ModelCard, type ScoreResult } from "@/lib/inference";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Analyze() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [model, setModel] = useState("bilabri-d2");
  const [card, setCard] = useState<ModelCard | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null); setError(null);
    if (inferEnabled) modelCard(model).then(setCard).catch(() => setCard(null));
  }, [model]);

  const run = async () => {
    if (busy) return;
    setBusy(true); setError(null); setResult(null);
    try { setResult(await scoreSample(model)); }
    catch (e) { setError(e instanceof Error ? e.message : "scoring failed"); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
        <View>
          <Text style={styles.title}>Analyze a Well</Text>
          <Text style={styles.sub}>Run a validated model on sample telemetry</Text>
        </View>
      </View>

      {!inferEnabled ? (
        <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={30} color={C.muted2} /><Text style={styles.emptyText}>Inference service not configured (EXPO_PUBLIC_INFER_BASE).</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
          <View>
            <SectionLabel>Choose a model</SectionLabel>
            <View style={styles.modelRow}>
              {MODELS.map((m) => {
                const active = m.id === model;
                return (
                  <Pressable key={m.id} onPress={() => setModel(m.id)} style={[styles.modelChip, active && styles.modelChipActive]}>
                    <Ionicons name="hardware-chip" size={16} color={active ? C.primary : C.muted} />
                    <Text style={[styles.modelLabel, active && { color: C.primary }]}>{m.label}</Text>
                    <Text style={styles.modelSub}>{m.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {card && (
            <Card>
              <SectionLabel>Model</SectionLabel>
              <Row k="Validated on" v={`${card.well}`} />
              <Row k="Mechanism" v={card.mechanism.replace(/_/g, " ")} />
              <Row k="Monitors" v={card.monitors.join(" + ")} />
              <Row k="Inputs" v={card.raw_inputs.join(", ")} />
            </Card>
          )}

          <Pressable onPress={run} disabled={busy} style={[styles.runBtn, busy && { opacity: 0.6 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <><Ionicons name="play" size={17} color="#fff" /><Text style={styles.runText}>Run sample analysis</Text></>}
          </Pressable>

          {error && (
            <View style={styles.errBox}><Ionicons name="warning" size={16} color={C.high} /><Text style={styles.errText}>{error}</Text></View>
          )}

          {result && (
            <>
              <View style={styles.tiles}>
                <Tile label="Windows scored" value={fmt(result.rows_scored)} />
                <Tile label="Peak risk" value={result.peak_risk ? `${Math.round(result.peak_risk.risk)}` : "—"} sub={result.peak_risk ? `@ ${fmt(result.peak_risk.depth)} m` : ""} tone={C.high} />
                <Tile label="Escalations" value={String(result.tier_crossings.length)} tone={C.medium} />
              </View>

              <Card>
                <SectionLabel>Risk trajectory · computed by the model</SectionLabel>
                <RiskChart traj={result.trajectory} />
              </Card>

              <Card>
                <SectionLabel>Detected escalations</SectionLabel>
                {result.tier_crossings.length === 0 ? (
                  <Text style={styles.note}>Held at Normal on this run.</Text>
                ) : result.tier_crossings.map((c, i) => (
                  <View key={i} style={styles.evRow}>
                    <Ionicons name="flag" size={15} color={tierColor[c.tier as keyof typeof tierColor] ?? C.muted} />
                    <Text style={styles.evTitle}>Crossed into {c.tier}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.evMeta}>{fmt(c.depth)} m · risk {c.risk == null ? "—" : Math.round(c.risk)}</Text>
                  </View>
                ))}
                <Text style={styles.note}>{fmt(result.rows_scored)} windows scored through RF + LSTM-AE + DTW — computed by the model, not pre-recorded.</Text>
              </Card>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <View style={styles.kv}><Text style={styles.kvKey}>{k}</Text><Text style={styles.kvVal} numberOfLines={1}>{v}</Text></View>;
}
function Tile({ label, value, sub, tone = C.text }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileVal, { color: tone }]}>{value}</Text>
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
    </View>
  );
}
function RiskChart({ traj }: { traj: ScoreResult["trajectory"] }) {
  const pts = traj.filter((t) => t.risk != null);
  const W = 300, H = 120;
  if (pts.length < 2) return <Text style={styles.note}>Not enough points.</Text>;
  const xs = pts.map((_, i) => i), maxX = xs.length - 1;
  const line = pts.map((p, i) => `${(i / maxX) * W},${H - (Math.max(0, Math.min(100, p.risk!)) / 100) * (H - 6) - 3}`).join(" ");
  const yFor = (v: number) => H - (v / 100) * (H - 6) - 3;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[90, 97].map((thr) => <Line key={thr} x1={0} y1={yFor(thr)} x2={W} y2={yFor(thr)} stroke={C.border} strokeWidth={0.7} strokeDasharray="4 4" />)}
      <Polyline points={line} fill="none" stroke={C.high} strokeWidth={2} strokeLinejoin="round" />
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
  modelRow: { flexDirection: "row", gap: 8 },
  modelChip: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  modelChipActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  modelLabel: { fontSize: 13, fontWeight: "700", color: C.text },
  modelSub: { fontSize: 10.5, color: C.muted },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, gap: 10 },
  kvKey: { fontSize: 13, color: C.text2 },
  kvVal: { fontSize: 13, fontWeight: "700", color: C.text, flexShrink: 1 },
  runBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, backgroundColor: C.primary },
  runText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  errBox: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.highSoft, borderRadius: 10, padding: 12 },
  errText: { flex: 1, color: C.high, fontSize: 13 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12 },
  tileLabel: { fontSize: 11.5, color: C.muted },
  tileVal: { fontSize: 22, fontWeight: "800", marginTop: 3 },
  tileSub: { fontSize: 10.5, color: C.muted2, marginTop: 2 },
  evRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  evTitle: { fontSize: 13.5, fontWeight: "600", color: C.text },
  evMeta: { fontSize: 12, color: C.muted },
  note: { fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 17 },
});
