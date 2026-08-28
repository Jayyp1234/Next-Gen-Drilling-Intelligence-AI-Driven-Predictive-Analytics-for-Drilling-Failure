import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReplay } from "@/lib/replay";
import { api, type ApiAlert } from "@/lib/api";
import { C, sevColor } from "@/lib/theme";
import { Card, Badge, SectionLabel } from "@/components/ui";

const MECH_TYPE: Record<string, string> = { stuck_pipe: "Stuck Pipe", bit_wear: "Bit Wear", stick_slip: "Stick-Slip", pack_off: "Pack-Off" };
const TIER_SEV: Record<string, "high" | "medium" | "low"> = { Action: "high", Elevated: "medium", Watch: "low" };

export default function Alerts() {
  const r = useReplay();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<string | null>(null);
  // Shared operations feed from the PHP backend (same feed the web app shows).
  const [feed, setFeed] = useState<ApiAlert[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setFeed(await api.alerts());
    } catch {
      setFeed(null); // backend unreachable — session escalations still render
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ack = async (a: ApiAlert) => {
    setBusy(`ack-${a.id}`);
    try {
      await api.ackAlert(a.id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const escalate = async (a: (typeof r.alerts)[number]) => {
    setBusy(a.id);
    try {
      await api.createIncident({
        title: a.title, description: a.desc,
        type: MECH_TYPE[r.dataset?.mechanism ?? ""] ?? "Other",
        severity: a.sev, well_label: r.dataset?.well, origin: "escalated",
      });
      router.push("/(tabs)/incidents");
    } catch {
      setBusy(null);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Operations feed · shared with the web dashboard</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {/* ---- Backend feed: alerts recorded in the DB (SMS/email attached) ---- */}
        {feed !== null && (
          <>
            <SectionLabel>Operations feed ({feed.length})</SectionLabel>
            {feed.length === 0 && (
              <Card style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text style={styles.emptyDesc}>No recorded alerts yet.</Text>
              </Card>
            )}
            {feed.map((a) => {
              const sev = TIER_SEV[a.tier] ?? "low";
              const acked = a.status === "acknowledged";
              return (
                <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ width: 4, backgroundColor: sevColor[sev] }} />
                    <View style={{ flex: 1, padding: 14 }}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.alertTitle}>{a.title}</Text>
                        <Badge sev={sev}>{a.tier}</Badge>
                      </View>
                      {a.description ? <Text style={styles.alertDesc}>{a.description}</Text> : null}
                      <Text style={styles.alertMeta}>
                        {a.well ?? "—"}
                        {a.risk_score != null ? ` · risk ${Math.round(a.risk_score)}` : ""}
                        {a.index_value != null ? ` · ${a.index_label ?? ""} ${a.index_value}` : ""} · {a.created_at}
                      </Text>
                      {acked ? (
                        <View style={styles.ackedRow}>
                          <Ionicons name="checkmark-circle" size={15} color={C.good} />
                          <Text style={styles.ackedText}>Acknowledged</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => ack(a)} disabled={busy === `ack-${a.id}`} style={styles.escBtn}>
                          {busy === `ack-${a.id}` ? <ActivityIndicator size="small" color={C.primary} /> : (
                            <><Ionicons name="checkmark-circle-outline" size={16} color={C.primary} /><Text style={styles.escText}>Acknowledge</Text></>
                          )}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* ---- This session's replay escalations (local, escalate to incident) ---- */}
        <SectionLabel>This replay session · {r.dataset?.well ?? "no well"}</SectionLabel>
        {r.alerts.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 30 }}>
            <Ionicons name="notifications-off-outline" size={26} color={C.muted2} />
            <Text style={styles.emptyTitle}>No escalations yet</Text>
            <Text style={styles.emptyDesc}>Press play (or Jump to event) on the Live tab to advance the replay.</Text>
          </Card>
        ) : (
          r.alerts.map((a) => (
            <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ flexDirection: "row" }}>
                <View style={{ width: 4, backgroundColor: sevColor[a.sev] }} />
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    <Badge sev={a.sev}>{a.tier}</Badge>
                  </View>
                  <Text style={styles.alertDesc}>{a.desc}</Text>
                  <Text style={styles.alertMeta}>{r.dataset?.units.indexLabel} {a.at}</Text>
                  <Pressable onPress={() => escalate(a)} disabled={busy === a.id} style={styles.escBtn}>
                    {busy === a.id ? <ActivityIndicator size="small" color={C.primary} /> : (
                      <><Ionicons name="arrow-up-circle-outline" size={16} color={C.primary} /><Text style={styles.escText}>Escalate to incident</Text></>
                    )}
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: C.text },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: C.text, flex: 1 },
  alertDesc: { fontSize: 12.5, color: C.text2, marginTop: 4 },
  alertMeta: { fontSize: 11.5, color: C.muted, marginTop: 6 },
  escBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 12 },
  escText: { color: C.primary, fontSize: 13, fontWeight: "700" },
  ackedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  ackedText: { color: C.good, fontSize: 13, fontWeight: "700" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 10 },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6, maxWidth: 280 },
});
