import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReplay } from "@/lib/replay";
import { C } from "@/lib/theme";
import { Card, SectionLabel, KV } from "@/components/ui";

const STEPS = ["Run Mode", "Well Info", "Configuration", "Data Connection", "Review"];
const SPEEDS = [1, 3, 5, 10, 50];

export default function Initialize() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();

  const [step, setStep] = useState(0);
  const [runMode, setRunMode] = useState<"sim" | "live">("sim");
  const [chosen, setChosen] = useState(r.dataset?.id ?? r.catalog[0]?.id ?? "");
  const [speed, setSpeed] = useState(3);
  const [models, setModels] = useState({ rf: true, lstm: true, dtw: true });
  const ds = r.catalog.find((d) => d.id === chosen) ?? r.dataset;

  const [wellName, setWellName] = useState("");
  const [field, setField] = useState("");
  const [operator, setOperator] = useState("");
  const [objective, setObjective] = useState("Oil Exploration");
  // Sync editable metadata to the chosen dataset (until the user overrides it).
  useEffect(() => { if (ds) { setWellName(ds.well); setField(ds.field); setOperator(ds.field.split(",").pop()?.trim() ?? "Operator"); } }, [chosen]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = STEPS.length - 1;
  const canNext = step === 3 ? !!chosen : true;

  const finish = async () => {
    if (chosen && chosen !== r.dataset?.id) await r.select(chosen);
    r.setSpeed(speed);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View>
          <Text style={styles.title}>Initialize Well</Text>
          <Text style={styles.sub}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
        {step === 0 && (
          <>
            <Text style={styles.h}>How would you like to run this well?</Text>
            <RadioCard icon="play-circle" title="Simulation / Replay" desc="Load a prepared field dataset and run DrillGuard as if it were live." selected={runMode === "sim"} onPress={() => setRunMode("sim")} />
            <RadioCard icon="hardware-chip" title="Live Operations" desc="Connect to a live rig telemetry stream (requires a rig gateway)." selected={runMode === "live"} onPress={() => setRunMode("live")} disabled />
            <Text style={styles.note}>Live sensor ingest needs a rig WITSML/gateway connection — not available in this demo build. Replay runs the real validated datasets.</Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.h}>Well Information</Text>
            <Text style={styles.note}>Contextual metadata for the well. Pre-filled from the selected dataset — edit if needed.</Text>
            <Card>
              <Field label="Well Name" value={wellName} onChange={setWellName} />
              <Field label="Field / Location" value={field} onChange={setField} />
              <Field label="Operator" value={operator} onChange={setOperator} />
              <Field label="Well Objective" value={objective} onChange={setObjective} />
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.h}>Configuration</Text>
            <Card>
              <SectionLabel>Detection Models</SectionLabel>
              <Toggle label="Random Forest — point classifier" on={models.rf} onToggle={() => setModels((m) => ({ ...m, rf: !m.rf }))} />
              <Toggle label="LSTM autoencoder — trend detector" on={models.lstm} onToggle={() => setModels((m) => ({ ...m, lstm: !m.lstm }))} />
              <Toggle label="DTW shape matcher — morphology" on={models.dtw} onToggle={() => setModels((m) => ({ ...m, dtw: !m.dtw }))} />
            </Card>
            <Card>
              <SectionLabel>Playback Speed</SectionLabel>
              <View style={styles.speedRow}>
                {SPEEDS.map((s) => (
                  <Pressable key={s} onPress={() => setSpeed(s)} style={[styles.speedChip, s === speed && styles.speedChipActive]}>
                    <Text style={[styles.speedText, s === speed && { color: "#fff" }]}>{s}×</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
            <Card>
              <SectionLabel>Alert Tiers</SectionLabel>
              <KV k="Watch" v="90th percentile" />
              <KV k="Elevated" v="97th percentile" />
              <KV k="Action" v="99th percentile" />
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.h}>Data Connection</Text>
            <Text style={styles.note}>Select a validated field dataset to replay. Alerts, incidents and KPIs are generated live during the run.</Text>
            {r.catalog.length === 0 ? (
              <Card style={{ alignItems: "center", paddingVertical: 30 }}>
                <Ionicons name="cloud-offline-outline" size={28} color={C.muted2} />
                <Text style={styles.note}>Backend unreachable — start the PHP API.</Text>
              </Card>
            ) : r.catalog.map((d) => {
              const active = d.id === chosen;
              return (
                <Pressable key={d.id} onPress={() => setChosen(d.id)} style={[styles.dsCard, active && styles.dsCardActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dsName, active && { color: C.primary }]} numberOfLines={1}>{d.name || d.well}</Text>
                    <Text style={styles.dsMeta}>{d.field} · {d.mechanism.replace(/_/g, " ")} · {d.labelTier}</Text>
                  </View>
                  <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? C.primary : C.muted2} />
                </Pressable>
              );
            })}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.h}>Review & Initialize</Text>
            <Card>
              <SectionLabel>Run Configuration</SectionLabel>
              <KV k="Run Mode" v="Simulation / Replay" />
              <KV k="Well" v={ds?.well ?? "—"} />
              <KV k="Field" v={ds?.field ?? "—"} />
              <KV k="Dataset" v={ds?.name ?? "—"} />
              <KV k="Mechanism" v={(ds?.mechanism ?? "").replace(/_/g, " ")} />
              <KV k="Data Tier" v={ds?.labelTier ?? "—"} />
              <KV k="Models" v={[models.rf && "RF", models.lstm && "LSTM", models.dtw && "DTW"].filter(Boolean).join(" + ") || "none"} />
              <KV k="Playback Speed" v={`${speed}×`} />
              <KV k="Objective" v={objective} />
            </Card>
            {!!ds?.evidence && (
              <View style={styles.evBanner}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.good} />
                <Text style={styles.evText}>{ds.evidence}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.btnGhost}><Ionicons name="chevron-back" size={16} color={C.text2} /><Text style={styles.btnGhostText}>Back</Text></Pressable>
        ) : <View style={{ flex: 1 }} />}
        {step < last ? (
          <Pressable onPress={() => canNext && setStep((s) => s + 1)} style={[styles.btnPrimary, !canNext && { opacity: 0.5 }]} disabled={!canNext}>
            <Text style={styles.btnPrimaryText}>Next</Text><Ionicons name="chevron-forward" size={16} color="#fff" />
          </Pressable>
        ) : (
          <Pressable onPress={finish} style={styles.btnPrimary}>
            <Ionicons name="rocket" size={16} color="#fff" /><Text style={styles.btnPrimaryText}>Initialize & Start</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function RadioCard({ icon, title, desc, selected, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.radio, selected && styles.radioActive, disabled && { opacity: 0.55 }]}>
      <View style={[styles.radioIcon, { backgroundColor: selected ? C.primary : C.surface2 }]}><Ionicons name={icon} size={20} color={selected ? "#fff" : C.muted} /></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.radioTitle}>{title}</Text>
          {disabled && <Text style={styles.soon}>SOON</Text>}
        </View>
        <Text style={styles.radioDesc}>{desc}</Text>
      </View>
      <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? C.primary : C.muted2} />
    </Pressable>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} style={styles.input} placeholderTextColor={C.muted2} />
    </View>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switch, on && styles.switchOn]}><View style={[styles.knob, on && styles.knobOn]} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 1 },
  stepper: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.primary },
  stepDotDone: { backgroundColor: C.good },
  h: { fontSize: 18, fontWeight: "800", color: C.text },
  note: { fontSize: 13, color: C.muted, lineHeight: 19 },
  radio: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14 },
  radioActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  radioIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  radioTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  radioDesc: { fontSize: 12.5, color: C.muted, marginTop: 3, lineHeight: 17 },
  soon: { fontSize: 9, fontWeight: "800", color: C.medium, backgroundColor: C.mediumSoft, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", color: C.text2, marginBottom: 6 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: 14, color: C.text },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  toggleLabel: { flex: 1, fontSize: 13.5, color: C.text, fontWeight: "500", paddingRight: 10 },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: C.border, padding: 3 },
  switchOn: { backgroundColor: C.primary },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  knobOn: { transform: [{ translateX: 18 }] },
  speedRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  speedChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  speedChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  speedText: { fontSize: 13, fontWeight: "700", color: C.text2 },
  dsCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, padding: 14 },
  dsCardActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  dsName: { fontSize: 14, fontWeight: "700", color: C.text },
  dsMeta: { fontSize: 11.5, color: C.muted, marginTop: 3 },
  evBanner: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: C.goodSoft, borderRadius: 12, padding: 12 },
  evText: { flex: 1, fontSize: 12, color: C.text2, lineHeight: 17 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  btnGhost: { flexDirection: "row", alignItems: "center", gap: 4, height: 48, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  btnGhostText: { fontSize: 14, fontWeight: "600", color: C.text2 },
  btnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48, borderRadius: 12, backgroundColor: C.primary },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
