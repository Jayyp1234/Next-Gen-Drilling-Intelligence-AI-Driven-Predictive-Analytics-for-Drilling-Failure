import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { C } from "@/lib/theme";

const DEMO_EMAIL = "engineer@drilcorp.com";
const DEMO_PASS = "drillguard";

export default function Login() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (ready && user) router.replace("/(tabs)"); }, [ready, user]);

  const submit = async (pwd?: string) => {
    setError(null);
    const pass = pwd ?? password;
    if (!email.trim() || !pass) { setError("Enter your email and password."); return; }
    setBusy(true);
    try {
      await signIn(email.trim(), pass);
      router.replace("/(tabs)");
    } catch {
      setError("Invalid email or password, or backend unreachable.");
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <View style={styles.brand}>
        <View style={styles.logoRow}>
          <Ionicons name="shield-checkmark" size={26} color="#fff" />
          <Text style={styles.logoText}>DRILL<Text style={{ color: "#5b8cff" }}>GUARD</Text></Text>
        </View>
        <Text style={styles.tagline}>Predict drilling failures before they escalate.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h1}>Sign in</Text>
        <Text style={styles.sub}>Access your drilling operations.</Text>

        <Text style={styles.field}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={17} color={C.muted} />
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            placeholder="you@company.com" placeholderTextColor={C.muted2} style={styles.input} />
        </View>

        <Text style={styles.field}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color={C.muted} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry
            placeholder="••••••••" placeholderTextColor={C.muted2} style={styles.input} />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={() => submit()} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryBtnText}>Sign in</Text><Ionicons name="arrow-forward" size={17} color="#fff" /></>}
        </Pressable>

        <Pressable onPress={() => { setPassword(DEMO_PASS); submit(DEMO_PASS); }} disabled={busy} style={styles.demoBtn}>
          <Ionicons name="play" size={15} color={C.primary} />
          <Text style={styles.demoBtnText}>Launch investor demo</Text>
        </Pressable>
        <Text style={styles.demoHint}>{DEMO_EMAIL} · {DEMO_PASS}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  brand: { paddingTop: 90, paddingHorizontal: 28, paddingBottom: 28 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
  tagline: { color: C.navyMuted, fontSize: 15, marginTop: 14, lineHeight: 22, maxWidth: 300 },
  card: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingTop: 30 },
  h1: { fontSize: 26, fontWeight: "800", color: C.text },
  sub: { fontSize: 14, color: C.muted, marginTop: 4, marginBottom: 22 },
  field: { fontSize: 13, fontWeight: "600", color: C.text2, marginBottom: 6, marginTop: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, color: C.text },
  error: { color: C.high, fontSize: 13, fontWeight: "600", marginTop: 14, backgroundColor: C.highSoft, padding: 10, borderRadius: 8 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 12, backgroundColor: C.primary, marginTop: 24 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  demoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.primary, backgroundColor: C.primarySoft, marginTop: 12 },
  demoBtnText: { color: C.primary, fontSize: 15, fontWeight: "700" },
  demoHint: { textAlign: "center", color: C.muted, fontSize: 12, marginTop: 12 },
});
