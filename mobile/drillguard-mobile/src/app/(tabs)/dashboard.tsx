import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Polyline, Polygon, Circle, Line } from "react-native-svg";
import { useReplay } from "@/lib/replay";
import { api, type ApiAlert, type ReplayRow } from "@/lib/api";
import { C, tierColor, sevColor, riskStatus, type Sev } from "@/lib/theme";
import { Card } from "@/components/ui";

const TIER_SEV: Record<string, Sev> = { Action: "high", Elevated: "medium", Watch: "low" };
const MECH_SHORT: Record<string, string> = {
  stuck_pipe: "Stuck Pipe", stick_slip: "Stick-Slip", pack_off: "Pack-Off", bit_wear: "Bit Wear",
};
const fmt = (v: number | undefined | null, d = 0) =>
  v === undefined || v === null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d });

/* ---------------------------------------------------------------- gauge */
function Gauge({ value }: { value: number }) {
  // Semicircle gauge, needle at value% of 180°.
  const R = 34, CX = 40, CY = 42;
  const arc = (a0: number, a1: number, color: string) => {
    const p = (a: number) => [CX - R * Math.cos((a * Math.PI) / 180), CY - R * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return <Path key={a0} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={color} strokeWidth={7.5} strokeLinecap="round" fill="none" />;
  };
  const ang = Math.max(2, Math.min(178, (value / 100) * 180));
  const nx = CX - (R - 11) * Math.cos((ang * Math.PI) / 180);
  const ny = CY - (R - 11) * Math.sin((ang * Math.PI) / 180);
  return (
    <Svg width={80} height={48} viewBox="0 0 80 48">
      {arc(4, 60, C.good)}
      {arc(68, 104, "#eab308")}
      {arc(112, 140, C.medium)}
      {arc(148, 176, C.high)}
      <Line x1={CX} y1={CY} x2={nx} y2={ny} stroke={C.text} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={CX} cy={CY} r={3.8} fill={C.text} />
    </Svg>
  );
}

/* ------------------------------------------------------------ mini chart */
function MiniArea({ rows, pick, color, w = 74, h = 44 }: {
  rows: ReplayRow[]; pick: (r: ReplayRow) => number | undefined; color: string; w?: number; h?: number;
}) {
  // Inner padding keeps the stroke and fill fully inside the SVG box, so the
  // chart never visually spills past the card's rounded edge.
  const P = 2;
  const vals = rows.map(pick).map((v) => (v !== undefined && Number.isFinite(v) ? v : null));
  const finite = vals.filter((v): v is number => v !== null);
  if (finite.length < 2) return <View style={{ width: w, height: h }} />;
  const lo = Math.min(...finite), hi = Math.max(...finite);
  const x = (i: number) => P + (i / (vals.length - 1)) * (w - 2 * P);
  const y = (v: number) => (hi === lo ? h / 2 : h - P - 3 - ((v - lo) / (hi - lo)) * (h - 2 * P - 10));
  const pts = vals.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[];
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polygon points={`${P},${h - P} ${pts.join(" ")} ${w - P},${h - P}`} fill={color} opacity={0.12} />
      <Polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- screen */
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();
  const [feed, setFeed] = useState<ApiAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => api.alerts().then(setFeed).catch(() => {}), []);
  useEffect(() => {
    void load();
  }, [load]);
  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const cur = r.current;
  const risk = Math.round(cur?.risk ?? 0);
  const tier = (cur?.tier ?? "Normal") as keyof typeof tierColor;
  const status = riskStatus(risk, tier);
  const win = useMemo(() => r.rows.slice(Math.max(0, r.cursor - 59), r.cursor + 1), [r.rows, r.cursor]);
  const isEos = r.dataset?.indexKind === "time_1900_days";
  const activeCount = feed.filter((a) => a.status === "active").length;

  // Channels that genuinely exist per dataset family — no fabricated series.
  const params = isEos
    ? [
        { name: "Collar RPM", unit: "rpm", color: C.good, pick: (x: ReplayRow) => x.ch.crpm },
        { name: "Stick-Slip", unit: "c/min", color: C.high, pick: (x: ReplayRow) => x.ch.stick },
        { name: "ECD", unit: "sg", color: "#2563eb", d: 2, pick: (x: ReplayRow) => x.ch.ecd },
        { name: "Ann. Press", unit: "bar", color: "#7c3aed", pick: (x: ReplayRow) => x.ch.dhap },
      ]
    : [
        { name: "Torque", unit: "ft-lb", color: C.high, pick: (x: ReplayRow) => x.ch.torque },
        { name: "Standpipe", unit: "psi", color: "#2563eb", pick: (x: ReplayRow) => x.ch.spp },
        { name: "ROP", unit: "ft/hr", color: C.good, pick: (x: ReplayRow) => x.ch.rop },
        { name: "Flow", unit: "gpm", color: "#7c3aed", pick: (x: ReplayRow) => x.ch.flow },
      ];
  const stats = isEos
    ? [
        { icon: "time-outline", label: "Run Time", value: r.fmtIdx(cur?.idx ?? 0) },
        { icon: "sync-outline", label: "Collar RPM", value: fmt(cur?.ch.crpm) },
        { icon: "pulse-outline", label: "STICK", value: fmt(cur?.ch.stick) },
        { icon: "speedometer-outline", label: "ECD", value: fmt(cur?.ch.ecd, 2) },
      ]
    : [
        { icon: "locate-outline", label: "Bit Depth", value: cur ? r.fmtIdx(cur.idx) : "—" },
        { icon: "arrow-down-outline", label: "ROP", value: `${fmt(cur?.ch.rop)} ft/hr` },
        { icon: "speedometer-outline", label: "WOB", value: `${fmt(cur?.ch.wob, 1)} klbs` },
        { icon: "water-outline", label: "Flow", value: `${fmt(cur?.ch.flow)} gpm` },
      ];

  const activity = feed.slice(0, 3);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      {/* header */}
      <View style={s.header}>
        <Pressable onPress={() => router.push("/(tabs)/more")} hitSlop={10}>
          <Ionicons name="menu" size={24} color={C.text} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={s.wordmark}>DRILL<Text style={{ color: C.primary }}>GUARD</Text></Text>
          <Text style={s.tagline}>DRILL SMART. MONITOR RISK. PROTECT LIVES.</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/alerts")} hitSlop={10}>
          <Ionicons name="notifications-outline" size={24} color={C.text} />
          {activeCount > 0 && (
            <View style={s.bellBadge}><Text style={s.bellBadgeText}>{activeCount}</Text></View>
          )}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14, gap: 12 }}>
        {/* active well */}
        <Pressable onPress={() => router.push("/(tabs)")}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={s.wellIcon}><Ionicons name="business-outline" size={20} color={C.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>ACTIVE WELL</Text>
              <Text style={s.wellName}>{r.dataset?.well ?? "No well loaded"}</Text>
              <Text style={s.wellMeta}>{cur ? `${r.fmtIdx(cur.idx)} MD` : r.dataset?.field ?? ""}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={[s.dot, { backgroundColor: cur?.onb ? C.good : C.medium }]} />
                <Text style={[s.statusText, { color: cur?.onb ? C.good : C.medium }]}>
                  {cur?.onb ? "Drilling" : "Off bottom"}
                </Text>
              </View>
              <Text style={s.wellMeta}>{r.rows.length ? `row ${r.cursor + 1} / ${r.rows.length}` : "replay ready"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Card>
        </Pressable>

        {/* risk + alerts */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Card style={{ flex: 1.06 }}>
            <Text style={s.kicker}>RISK SCORE  ⓘ</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <View>
                <Text style={s.riskNum}>{risk}<Text style={s.riskDen}>/100</Text></Text>
                <Text style={[s.riskTier, { color: status.color }]}>{status.label}</Text>
              </View>
              <Gauge value={risk} />
            </View>
            <View style={{ marginTop: 10, alignSelf: "center", width: 134 }}>
              <View style={s.trendBox}>
                <MiniArea rows={win} pick={(x) => x.risk ?? undefined} color={status.color} w={134} h={42} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
                <Text style={s.axis}>{win.length ? r.fmtIdx(win[0].idx) : ""}</Text>
                <Text style={s.axis}>Now</Text>
              </View>
            </View>
          </Card>

          <Card style={{ flex: 1 }}>
            <Text style={s.kicker}>ACTIVE ALERTS</Text>
            {activity.length === 0 && <Text style={s.emptyMini}>No recorded alerts.</Text>}
            {activity.map((a) => {
              const sev = TIER_SEV[a.tier] ?? "low";
              return (
                <Pressable key={a.id} onPress={() => router.push("/(tabs)/alerts")} style={s.alertRow}>
                  <View style={[s.alertIcon, { backgroundColor: sevColor[sev] }]}>
                    <Ionicons name="warning" size={11} color="#fff" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.alertTitle} numberOfLines={1}>
                      {MECH_SHORT[a.mechanism] ?? a.title.replace(/ — .*/, "")}
                    </Text>
                    <Text style={s.alertMeta}>
                      {a.created_at.slice(11, 16)} · {a.tier}
                    </Text>
                  </View>
                  <View style={[s.tierDot, { backgroundColor: sevColor[sev] }]} />
                </Pressable>
              );
            })}
            <Pressable onPress={() => router.push("/(tabs)/alerts")} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
              <Text style={s.link}>View all alerts</Text>
              <Ionicons name="arrow-forward" size={13} color={C.primary} />
            </Pressable>
          </Card>
        </View>

        {/* key parameters */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={s.kicker}>KEY PARAMETERS</Text>
            <View style={s.rtChip}>
              <View style={[s.dot, { backgroundColor: r.playing ? C.good : C.muted2 }]} />
              <Text style={s.rtChipText}>{r.playing ? "Streaming" : "Paused"}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            {params.map((p) => (
              <View key={p.name} style={{ width: 78 }}>
                <Text style={s.paramName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.paramValue}>
                  {fmt(cur ? p.pick(cur) : undefined, "d" in p ? (p as { d: number }).d : 0)}
                  <Text style={s.paramUnit}> {p.unit}</Text>
                </Text>
                <MiniArea rows={win} pick={p.pick} color={p.color} />
              </View>
            ))}
          </View>
        </Card>

        {/* quick stats */}
        <Card style={{ flexDirection: "row", paddingVertical: 12 }}>
          {stats.map((st, i) => (
            <View key={st.label} style={[s.statCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: C.border }]}>
              <View style={s.statIcon}>
                <Ionicons name={st.icon as keyof typeof Ionicons.glyphMap} size={15} color={C.primary} />
              </View>
              <Text style={s.statLabel}>{st.label}</Text>
              <Text style={s.statValue} numberOfLines={1}>{st.value}</Text>
            </View>
          ))}
        </Card>

        {/* recent activity */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={s.kicker}>RECENT ACTIVITY</Text>
            <Pressable onPress={() => router.push("/(tabs)/alerts")}><Text style={s.link}>View all</Text></Pressable>
          </View>
          {activity.length === 0 && <Text style={s.emptyMini}>Alerts recorded by the system will appear here.</Text>}
          {activity.map((a, i) => {
            const sev = TIER_SEV[a.tier] ?? "low";
            return (
              <View key={a.id} style={{ flexDirection: "row", gap: 12, marginTop: i === 0 ? 12 : 0 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={[s.dot, { backgroundColor: sevColor[sev], width: 9, height: 9, borderRadius: 5 }]} />
                  {i < activity.length - 1 && <View style={s.timelineStem} />}
                </View>
                <Pressable onPress={() => router.push("/(tabs)/alerts")} style={{ flex: 1, paddingBottom: i < activity.length - 1 ? 14 : 0, marginTop: -3 }}>
                  <Text style={s.activityTime}>{a.created_at.slice(11, 16)} · {a.well ?? "—"}</Text>
                  <Text style={s.activityTitle} numberOfLines={1}>{a.title}</Text>
                  {!!a.description && <Text style={s.activityDesc} numberOfLines={1}>{a.description}</Text>}
                </Pressable>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  wordmark: { fontSize: 19, fontWeight: "900", letterSpacing: 0.4, color: C.navy },
  tagline: { fontSize: 6.8, fontWeight: "700", letterSpacing: 0.9, color: C.muted, marginTop: 1 },
  bellBadge: {
    position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: C.high, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  bellBadgeText: { color: "#fff", fontSize: 9.5, fontWeight: "800" },

  kicker: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6, color: C.muted },
  wellIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  wellName: { fontSize: 17, fontWeight: "800", color: C.text, marginTop: 1 },
  wellMeta: { fontSize: 11.5, color: C.muted, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12.5, fontWeight: "700" },

  riskNum: { fontSize: 24, fontWeight: "900", color: C.text },
  riskDen: { fontSize: 11.5, fontWeight: "700", color: C.muted },
  riskTier: { fontSize: 11.5, fontWeight: "800", marginTop: 1 },
  axis: { fontSize: 9, color: C.muted2 },
  trendBox: { borderRadius: 8, overflow: "hidden", alignSelf: "flex-start" },

  alertRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  alertIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 12.5, fontWeight: "700", color: C.text },
  alertMeta: { fontSize: 10, color: C.muted },
  tierDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  link: { fontSize: 12.5, fontWeight: "700", color: C.primary },
  emptyMini: { fontSize: 12, color: C.muted, marginTop: 10 },

  rtChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rtChipText: { fontSize: 11, fontWeight: "700", color: C.text2 },
  paramName: { fontSize: 10.5, color: C.muted, fontWeight: "600" },
  paramValue: { fontSize: 15, fontWeight: "900", color: C.text, marginTop: 1, marginBottom: 3 },
  paramUnit: { fontSize: 9.5, fontWeight: "600", color: C.muted },

  statCell: { flex: 1, alignItems: "center", gap: 3, paddingHorizontal: 4 },
  statIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 9.5, color: C.muted, fontWeight: "600" },
  statValue: { fontSize: 12, fontWeight: "800", color: C.text },

  timelineStem: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 2 },
  activityTime: { fontSize: 10.5, color: C.muted },
  activityTitle: { fontSize: 13, fontWeight: "700", color: C.text, marginTop: 1 },
  activityDesc: { fontSize: 11.5, color: C.text2, marginTop: 1 },
});
