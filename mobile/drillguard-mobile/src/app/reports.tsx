import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Incident } from "@/lib/api";
import { C, sevColor, type Sev } from "@/lib/theme";
import { Card, SectionLabel, Badge } from "@/components/ui";

const asSev = (s: string): Sev => (s === "high" || s === "medium" || s === "low" ? s : "medium");

export default function Reports() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Incident[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try { setError(false); setItems((await api.incidents()).incidents); }
    catch { setError(true); setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const inc = items ?? [];
  const documented = inc.filter((i) => i.origin === "documented").length;
  const escalated = inc.filter((i) => i.origin === "escalated").length;
  const manual = inc.filter((i) => i.origin === "manual").length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
        <View>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.sub}>Report register · live from database</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {items === null ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator color={C.primary} /></View>
        ) : (
          <>
            <View style={styles.grid}>
              <Kpi label="Incident Reports" value={String(inc.length)} sub="in the database" tone={C.primary} />
              <Kpi label="Documented" value={String(documented)} sub="GEOL / DDR anchored" tone={C.good} />
              <Kpi label="Escalated" value={String(escalated)} sub="model → incident" tone={C.medium} />
              <Kpi label="Manually Reported" value={String(manual)} sub="crew-logged" tone="#7c3aed" />
            </View>

            <Card>
              <SectionLabel>Incident Reports</SectionLabel>
              {inc.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <Ionicons name={error ? "cloud-offline-outline" : "document-text-outline"} size={28} color={C.muted2} />
                  <Text style={styles.emptyText}>{error ? "Backend unreachable — check the PHP API." : "No reports yet."}</Text>
                </View>
              ) : inc.map((i) => (
                <Pressable key={i.code} style={styles.repRow} onPress={() => router.push("/(tabs)/incidents")}>
                  <View style={[styles.repIcon, { backgroundColor: sevColor[asSev(i.severity)] + "1a" }]}>
                    <Ionicons name="document-text" size={16} color={sevColor[asSev(i.severity)]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.repName} numberOfLines={1}>{i.code} · {i.title}</Text>
                    <View style={styles.repMeta}>
                      <Badge sev={asSev(i.severity)}>{i.type}</Badge>
                      <Text style={styles.meta}>{i.well ?? "—"} · {i.origin}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.muted2} />
                </Pressable>
              ))}
            </Card>

            <Text style={styles.note}>Every row is a real incident record from the PHP/MariaDB backend — documented field events, model escalations and crew-logged reports. Pull to refresh.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, sub, tone = C.text }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "47.8%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  kpiLabel: { fontSize: 12, color: C.muted },
  kpiValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  kpiSub: { fontSize: 11, color: C.muted2, marginTop: 3 },
  repRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  repIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  repName: { fontSize: 13.5, fontWeight: "600", color: C.text },
  repMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" },
  meta: { fontSize: 11.5, color: C.muted },
  emptyText: { fontSize: 13, color: C.muted, marginTop: 8 },
  note: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
