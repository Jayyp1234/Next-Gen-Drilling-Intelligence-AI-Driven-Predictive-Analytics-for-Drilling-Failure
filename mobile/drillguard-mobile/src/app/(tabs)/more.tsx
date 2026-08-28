import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useReplay } from "@/lib/replay";
import { API_BASE } from "@/lib/api";
import { C } from "@/lib/theme";
import { Card, SectionLabel, KV } from "@/components/ui";

export default function More() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const r = useReplay();
  const router = useRouter();

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}>
      <View style={styles.header}><Text style={styles.title}>More</Text></View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        {/* User */}
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.initials ?? "DE"}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? "Drilling Engineer"}</Text>
            <Text style={styles.email}>{user?.email ?? ""}</Text>
          </View>
        </Card>

        {/* Active well */}
        {r.dataset && (
          <Card>
            <SectionLabel>Active Well</SectionLabel>
            <KV k="Well" v={r.dataset.well} />
            <KV k="Field" v={r.dataset.field} />
            <KV k="Mechanism" v={r.dataset.mechanism.replace(/_/g, " ")} />
            <KV k="Data Tier" v={r.dataset.labelTier} />
            {!!r.dataset.evidence && <Text style={styles.evidence}>{r.dataset.evidence}</Text>}
          </Card>
        )}

        {/* Initialize a well */}
        <Pressable onPress={() => router.push("/initialize")} style={styles.initBtn}>
          <Ionicons name="rocket-outline" size={18} color="#fff" />
          <Text style={styles.initText}>Initialize a Well</Text>
        </Pressable>

        {/* Well screens */}
        <Card style={{ paddingVertical: 6 }}>
          <Pressable onPress={() => router.push("/analyze")} style={styles.navRow}>
            <Ionicons name="hardware-chip" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Analyze a Well</Text>
              <Text style={styles.navMeta}>Run a validated model on telemetry — live inference</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/messages")} style={styles.navRow}>
            <Ionicons name="chatbubbles" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Crew Channel</Text>
              <Text style={styles.navMeta}>Team messaging — shared with the web dashboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/onboarding")} style={styles.navRow}>
            <Ionicons name="sparkles" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>App Tour</Text>
              <Text style={styles.navMeta}>Replay the DrillGuard introduction</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/performance")} style={styles.navRow}>
            <Ionicons name="stats-chart" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Performance</Text>
              <Text style={styles.navMeta}>Measured ROP, MSE, parameters, daily log</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/well-history")} style={styles.navRow}>
            <Ionicons name="server" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Well History</Text>
              <Text style={styles.navMeta}>Depth profile, events, integrity & risk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/sustainability")} style={styles.navRow}>
            <Ionicons name="leaf" size={19} color={C.good} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Sustainability</Text>
              <Text style={styles.navMeta}>Estimated CO₂ / fuel from measured activity</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
          <View style={styles.navDivider} />
          <Pressable onPress={() => router.push("/reports")} style={styles.navRow}>
            <Ionicons name="document-text" size={19} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Reports</Text>
              <Text style={styles.navMeta}>Incident report register · from database</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2} />
          </Pressable>
        </Card>

        {/* Dataset switcher */}
        {r.catalog.length > 0 && (
          <Card>
            <SectionLabel>Replay Datasets</SectionLabel>
            {r.catalog.map((d) => {
              const active = d.id === r.dataset?.id;
              return (
                <Pressable key={d.id} onPress={() => r.select(d.id)} style={[styles.dsRow, active && styles.dsActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dsName, active && { color: C.primary }]} numberOfLines={1}>{d.name || d.well}</Text>
                    <Text style={styles.dsMeta}>{d.field} · {d.mechanism.replace(/_/g, " ")}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </Pressable>
              );
            })}
          </Card>
        )}

        {/* Backend */}
        <Card>
          <SectionLabel>Connection</SectionLabel>
          <KV k="Backend API" v={API_BASE.replace(/^https?:\/\//, "")} />
          <KV k="Status" v={r.dataset ? "Connected" : "Offline"} vStyle={{ color: r.dataset ? C.good : C.high }} />
        </Card>

        <Pressable onPress={() => { signOut(); router.replace("/login"); }} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={18} color={C.high} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>DrillGuard · Execution-phase Drilling Intelligence</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: C.text },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.primary, fontWeight: "800", fontSize: 15 },
  name: { fontSize: 16, fontWeight: "700", color: C.text },
  email: { fontSize: 13, color: C.muted, marginTop: 2 },
  evidence: { fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 18 },
  initBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, backgroundColor: C.primary },
  initText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  navRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 6 },
  navTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  navMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  navDivider: { height: 1, backgroundColor: C.surface2 },
  dsRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  dsActive: { backgroundColor: C.primarySoft },
  dsName: { fontSize: 13.5, fontWeight: "600", color: C.text },
  dsMeta: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#f6c9c7", backgroundColor: C.highSoft },
  signOutText: { color: C.high, fontSize: 15, fontWeight: "700" },
  footer: { textAlign: "center", color: C.muted2, fontSize: 12, marginTop: 6 },
});
