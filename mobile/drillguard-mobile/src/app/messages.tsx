import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReplay } from "@/lib/replay";
import { useAuth } from "@/lib/auth";
import { api, type CrewMessage } from "@/lib/api";
import { C } from "@/lib/theme";

const POLL_MS = 2500;

export default function Messages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = useReplay();
  const { user } = useAuth();
  const channel = r.dataset?.id ?? "ops";
  const channelLabel = r.dataset?.well ?? "Operations";

  const [msgs, setMsgs] = useState<CrewMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const scroller = useRef<ScrollView>(null);

  const append = useCallback((rows: CrewMessage[]) => {
    if (!rows.length) return;
    setMsgs((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = rows.filter((m) => !seen.has(m.id));
      if (!fresh.length) return prev;
      lastId.current = Math.max(lastId.current, ...fresh.map((m) => m.id));
      return [...prev, ...fresh];
    });
  }, []);

  useEffect(() => {
    lastId.current = 0;
    setMsgs([]);
    api.messages(channel).then(append).catch(() => {});
    const t = setInterval(() => {
      api.messages(channel, lastId.current).then(append).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(t);
  }, [channel, append]);

  useEffect(() => {
    // Keep pinned to the newest message.
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [msgs.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const m = await api.postMessage(channel, body);
      setDraft("");
      append([m]);
    } catch {
      /* keep the draft so nothing is lost */
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Crew Channel</Text>
          <Text style={styles.sub}>{channelLabel} · shared with the web dashboard</Text>
        </View>
        <View style={styles.liveChip}><Text style={styles.liveChipText}>LIVE</Text></View>
      </View>

      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 10 }}>
        {msgs.length === 0 && (
          <Text style={styles.empty}>No messages yet — start the conversation below.</Text>
        )}
        {msgs.map((m) => {
          if (m.is_system) {
            return (
              <View key={m.id} style={styles.sysRow}>
                <Ionicons name="shield-half" size={15} color={C.medium} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sysAuthor}>DrillGuard · system</Text>
                  <Text style={styles.sysBody}>{m.body}</Text>
                  <Text style={styles.meta}>{m.created_at}</Text>
                </View>
              </View>
            );
          }
          const mine = m.author === user?.name;
          return (
            <View key={m.id} style={[styles.bubbleRow, mine && { justifyContent: "flex-end" }]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.author, mine && { color: "rgba(255,255,255,0.85)" }]}>
                  {m.author}{m.role ? `  ·  ${m.role}` : ""}
                </Text>
                <Text style={[styles.body, mine && { color: "#fff" }]}>{m.body}</Text>
                <Text style={[styles.meta, mine && { color: "rgba(255,255,255,0.6)" }]}>{m.created_at}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${channelLabel}…`}
          placeholderTextColor={C.muted2}
          style={styles.input}
          multiline
        />
        <Pressable onPress={send} disabled={sending || !draft.trim()} style={[styles.sendBtn, (sending || !draft.trim()) && { opacity: 0.5 }]}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={17} color="#fff" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  liveChip: { backgroundColor: C.goodSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  liveChipText: { color: C.good, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  empty: { color: C.muted, fontSize: 13.5, textAlign: "center", marginTop: 40 },
  sysRow: { flexDirection: "row", gap: 8, backgroundColor: C.mediumSoft ?? "#fff4e0", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  sysAuthor: { fontSize: 12, fontWeight: "800", color: C.medium },
  sysBody: { fontSize: 13.5, color: C.text, marginTop: 2 },
  bubbleRow: { flexDirection: "row" },
  bubble: { maxWidth: "80%", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleMine: { backgroundColor: C.primary },
  bubbleOther: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  author: { fontSize: 12, fontWeight: "800", color: C.text },
  body: { fontSize: 14, color: C.text2, marginTop: 2 },
  meta: { fontSize: 10.5, color: C.muted, marginTop: 4 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  input: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14.5, color: C.text },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
});
