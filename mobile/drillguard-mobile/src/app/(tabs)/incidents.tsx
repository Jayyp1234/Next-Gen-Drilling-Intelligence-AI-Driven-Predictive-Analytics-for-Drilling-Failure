import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Incident } from "@/lib/api";
import { C, sevColor, type Sev } from "@/lib/theme";
import { Card, Badge } from "@/components/ui";

const asSev = (s: string): Sev => (s === "high" || s === "medium" || s === "low" ? s : "medium");
const statusColor: Record<string, string> = { open: C.high, investigating: C.medium, resolved: C.good, closed: C.muted };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Incidents() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Incident[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try { setError(false); setItems((await api.incidents()).incidents); }
    catch { setError(true); setItems([]); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resolve = async (code: string) => {
    setBusy(code);
    try { await api.updateIncident(code, { status: "resolved" }); await load(); }
    finally { setBusy(null); }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Incidents</Text>
        <Text style={styles.subtitle}>Documented, escalated &amp; reported · live from database</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {items === null ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={C.primary} /></View>
        ) : items.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name={error ? "cloud-offline-outline" : "clipboard-outline"} size={30} color={C.muted2} />
            <Text style={styles.emptyTitle}>{error ? "Backend unreachable" : "No incidents recorded"}</Text>
            <Text style={styles.emptyDesc}>{error ? "Check the PHP API is running and reachable." : "Escalate an alert or report one to add it here."}</Text>
          </Card>
        ) : (
          items.map((i) => {
            const sev = asSev(i.severity);
            const sc = statusColor[i.status.toLowerCase()] ?? C.muted;
            return (
              <Card key={i.code} style={{ padding: 0, overflow: "hidden" }}>
                <View style={{ flexDirection: "row" }}>
                  <View style={{ width: 4, backgroundColor: sevColor[sev] }} />
                  <View style={{ flex: 1, padding: 14 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.code}>{i.code}</Text>
                      <View style={[styles.statusPill, { backgroundColor: sc + "1a" }]}>
                        <View style={[styles.dot, { backgroundColor: sc }]} />
                        <Text style={[styles.statusText, { color: sc }]}>{cap(i.status)}</Text>
                      </View>
                    </View>
                    <Text style={styles.iTitle}>{i.title}</Text>
                    <View style={styles.metaRow}>
                      <Badge sev={sev}>{i.type}</Badge>
                      <Text style={styles.meta}>{i.well ?? "—"}</Text>
                      <Text style={styles.meta}>· {i.origin}</Text>
                    </View>
                    {i.status.toLowerCase() !== "resolved" && i.status.toLowerCase() !== "closed" && (
                      <Pressable onPress={() => resolve(i.code)} disabled={busy === i.code} style={styles.resolveBtn}>
                        {busy === i.code ? <ActivityIndicator size="small" color={C.good} /> : (
                          <><Ionicons name="checkmark-circle-outline" size={16} color={C.good} /><Text style={styles.resolveText}>Mark resolved</Text></>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
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
  code: { fontSize: 13, fontWeight: "800", color: C.text },
  iTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  meta: { fontSize: 12, color: C.muted },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  resolveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 12 },
  resolveText: { color: C.good, fontSize: 13, fontWeight: "700" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 10 },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6, maxWidth: 280 },
});
