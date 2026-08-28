import { useRef, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { useAuth } from "@/lib/auth";
import { C } from "@/lib/theme";

const { width: W } = Dimensions.get("window");
export const ONBOARD_KEY = "dg-onboarded";

/* ---------------------------------------------------------------- shield */
function Shield({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 52) / 46} viewBox="0 0 46 52" fill="none">
      <Path d="M23 1 L44 9 V26 C44 40 34 48 23 51 C12 48 2 40 2 26 V9 Z" fill={C.navy} stroke={C.primary} strokeWidth={2} />
      <Path d="M23 12 L30 34 H16 Z M23 12 V34 M18 40 H28" stroke={C.primary} strokeWidth={2.1} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/* ------------------------------------------------- page 1 hero (rig + cards) */
function HeroRig() {
  return (
    <Svg width="100%" height={150} viewBox="0 0 360 150">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#dbeafe" />
          <Stop offset="1" stopColor="#f0f6ff" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="360" height="150" rx="16" fill="url(#sky)" />
      {/* sea */}
      <Rect x="0" y="118" width="360" height="32" fill="#bfd7f3" opacity={0.55} />
      <Line x1="14" y1="128" x2="90" y2="128" stroke="#9fc0e8" strokeWidth="2" strokeLinecap="round" />
      <Line x1="240" y1="136" x2="330" y2="136" stroke="#9fc0e8" strokeWidth="2" strokeLinecap="round" />
      {/* platform deck + legs */}
      <Rect x="52" y="96" width="110" height="10" rx="2" fill={C.navy} />
      <Rect x="62" y="106" width="8" height="24" fill={C.navy} />
      <Rect x="140" y="106" width="8" height="24" fill={C.navy} />
      <Rect x="96" y="106" width="6" height="24" fill={C.navy} opacity={0.7} />
      {/* derrick lattice */}
      <Path d="M88 96 L107 26 L126 96 Z" fill="none" stroke={C.navy} strokeWidth="3.4" strokeLinejoin="round" />
      <Line x1="94" y1="74" x2="120" y2="74" stroke={C.navy} strokeWidth="2.2" />
      <Line x1="98" y1="54" x2="116" y2="54" stroke={C.navy} strokeWidth="2.2" />
      <Line x1="94" y1="74" x2="116" y2="54" stroke={C.navy} strokeWidth="1.6" />
      <Line x1="120" y1="74" x2="98" y2="54" stroke={C.navy} strokeWidth="1.6" />
      <Line x1="107" y1="26" x2="107" y2="18" stroke={C.navy} strokeWidth="2.5" />
      {/* crane */}
      <Line x1="150" y1="96" x2="150" y2="66" stroke={C.navy} strokeWidth="3" />
      <Line x1="150" y1="66" x2="188" y2="80" stroke={C.navy} strokeWidth="2.6" />
      <Line x1="188" y1="80" x2="188" y2="92" stroke={C.navy} strokeWidth="1.6" />
      {/* sun */}
      <Circle cx="312" cy="34" r="13" fill="#fff7d6" stroke="#fcd34d" strokeWidth="1.5" />
      <Circle cx="312" cy="34" r="19" stroke="#fcd34d" strokeWidth="1" opacity={0.35} fill="none" />
    </Svg>
  );
}

function RiskSpark() {
  return (
    <Svg width={120} height={30} viewBox="0 0 120 30">
      <Polyline
        points="0,24 14,22 26,25 38,20 52,21 64,16 78,17 92,11 106,8 120,4"
        fill="none" stroke={C.good} strokeWidth="2.2" strokeLinejoin="round"
      />
      <Circle cx="120" cy="4" r="3" fill={C.high} />
    </Svg>
  );
}

/* ------------------------------------------------- page 2 illustration */
function MonitorIllo() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 240 }}>
      {/* monitor card */}
      <View style={illo.monitor}>
        <Svg width={150} height={64} viewBox="0 0 150 64">
          <Polyline points="0,50 16,42 30,48 46,34 62,40 78,26 94,32 110,18 128,24 150,8"
            fill="none" stroke={C.primary} strokeWidth="2.6" strokeLinejoin="round" />
        </Svg>
        <View style={{ gap: 5, marginTop: 8 }}>
          <View style={illo.lineWide} /><View style={illo.lineMid} /><View style={illo.lineNarrow} />
        </View>
      </View>
      {/* drill string */}
      <View style={illo.drillWrap}>
        <Svg width={90} height={190} viewBox="0 0 90 190">
          <Rect x="38" y="0" width="14" height="96" rx="3" fill="#c7d8f2" stroke={C.primary} strokeWidth="1.4" />
          <Rect x="33" y="26" width="24" height="10" rx="2" fill="#dbe7f8" stroke={C.primary} strokeWidth="1.2" />
          <Rect x="33" y="62" width="24" height="10" rx="2" fill="#dbe7f8" stroke={C.primary} strokeWidth="1.2" />
          {/* bit */}
          <Path d="M31 96 H59 L52 122 H38 Z" fill="#b3c9ea" stroke={C.primary} strokeWidth="1.6" strokeLinejoin="round" />
          <Path d="M38 122 L45 132 L52 122" fill="#9db8e0" stroke={C.primary} strokeWidth="1.4" strokeLinejoin="round" />
          {/* ripples */}
          <Circle cx="45" cy="152" r="14" stroke={C.primary} strokeWidth="1.4" opacity={0.5} fill="none" />
          <Circle cx="45" cy="152" r="26" stroke={C.primary} strokeWidth="1.2" opacity={0.3} fill="none" />
          <Circle cx="45" cy="152" r="38" stroke={C.primary} strokeWidth="1" opacity={0.16} fill="none" />
        </Svg>
      </View>
      {/* floating chips */}
      <View style={[illo.chip, { right: 12, top: 22 }]}>
        <Text style={illo.chipLabel}>HOOKLOAD</Text>
        <Text style={illo.chipValue}>85.6 <Text style={illo.chipUnit}>klb</Text></Text>
      </View>
      <View style={[illo.chip, { right: 26, top: 92 }]}>
        <Text style={illo.chipLabel}>RPM</Text>
        <Text style={illo.chipValue}>120</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------- page 3 illustration */
function AlertPhoneIllo() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 300 }}>
      <View style={illo.phone}>
        <View style={illo.phoneNotch} />
        <View style={{ alignItems: "center", marginTop: 14 }}>
          <View style={illo.alertTri}>
            <Ionicons name="warning" size={20} color="#fff" />
          </View>
          <Text style={illo.alertKicker}>ALERT</Text>
        </View>
        <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={illo.alertTitle}>Stuck Pipe Risk</Text>
            <View style={illo.highChip}><Text style={illo.highChipText}>High</Text></View>
          </View>
          <Text style={illo.alertMeta}>Depth: 1,659 m MD{"\n"}10:24 AM</Text>
          <Text style={illo.alertQ}>What&apos;s happening?</Text>
          <Text style={illo.alertA}>Unusual torque increase detected.</Text>
          <Text style={illo.alertQ}>Recommended action</Text>
          <Text style={illo.alertA}>Reduce overpull and monitor torque closely.</Text>
          <View style={illo.viewBtn}><Text style={illo.viewBtnText}>View Details</Text></View>
        </View>
      </View>
      {/* floating channel bubbles */}
      <View style={[illo.bubble, { left: W * 0.06, top: 96 }]}>
        <Ionicons name="notifications" size={20} color={C.medium} />
      </View>
      <View style={[illo.bubble, { right: W * 0.06, top: 70 }]}>
        <Ionicons name="chatbubble-ellipses" size={20} color={C.primary} />
      </View>
      <View style={[illo.bubble, { right: W * 0.12, bottom: 8 }]}>
        <Ionicons name="phone-portrait" size={20} color={C.high} />
      </View>
    </View>
  );
}

/* ------------------------------------------------- page 4 illustration */
function InsightsIllo() {
  return (
    <View style={{ height: 250, justifyContent: "center" }}>
      {/* risk trends card */}
      <View style={illo.trendCard}>
        <Text style={illo.cardKicker}>RISK TRENDS</Text>
        <Svg width={190} height={70} viewBox="0 0 190 70">
          <Polyline points="0,52 20,44 38,50 56,38 76,44 96,30 116,36 138,22 158,30 190,14"
            fill="none" stroke={C.high} strokeWidth="2.2" strokeLinejoin="round" />
          <Polyline points="0,58 24,54 46,58 70,48 94,52 120,42 146,46 190,34"
            fill="none" stroke={C.good} strokeWidth="2" strokeLinejoin="round" opacity={0.9} />
          <Rect x="128" y="8" width="46" height="54" fill={C.primary} opacity={0.08} />
        </Svg>
      </View>
      {/* well summary card */}
      <View style={illo.summaryCard}>
        <Text style={illo.cardKicker}>WELL SUMMARY</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
          <Svg width={44} height={44} viewBox="0 0 44 44">
            <Circle cx="22" cy="22" r="16" stroke={C.border} strokeWidth="7" fill="none" />
            <Path d="M22 6 A16 16 0 0 1 37 27" stroke={C.good} strokeWidth="7" fill="none" strokeLinecap="round" />
            <Path d="M37 27 A16 16 0 0 1 22 38" stroke={C.medium} strokeWidth="7" fill="none" strokeLinecap="round" />
          </Svg>
          <View style={{ gap: 5 }}>
            <View style={[illo.lineMid, { width: 74 }]} />
            <View style={[illo.lineNarrow, { width: 56 }]} />
            <View style={[illo.lineNarrow, { width: 64 }]} />
          </View>
        </View>
      </View>
      {/* pdf report card */}
      <View style={illo.pdfCard}>
        <Text style={illo.cardKicker}>PDF REPORT</Text>
        <View style={{ gap: 5, marginTop: 6 }}>
          <View style={[illo.lineMid, { width: 76 }]} />
          <View style={[illo.lineNarrow, { width: 60 }]} />
          <View style={[illo.lineNarrow, { width: 68 }]} />
        </View>
        <View style={illo.pdfChip}><Text style={illo.pdfChipText}>PDF</Text></View>
      </View>
      {/* cloud bubble */}
      <View style={[illo.bubble, { right: 18, top: -6 }]}>
        <Ionicons name="cloud-upload" size={20} color={C.primary} />
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- pieces */
function Dots({ page }: { page: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: i === page ? 18 : 7, height: 7, borderRadius: 4,
            backgroundColor: i === page ? C.primary : "#cbd7ea",
          }}
        />
      ))}
    </View>
  );
}

function FeatureCell({ icon, tint, bg, title, sub }: { icon: React.ReactNode; tint: string; bg: string; title: string; sub: string }) {
  return (
    <View style={s.featCell}>
      <View style={[s.featIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.featTitle}>{title}</Text>
        <Text style={s.featSub}>{sub}</Text>
      </View>
    </View>
  );
}

function ParamIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 6, width: (W - 64) / 5 }}>
      <View style={s.paramCircle}>{icon}</View>
      <Text style={s.paramLabel}>{label}</Text>
    </View>
  );
}

/* ================================================================= screen */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const list = useRef<FlatList>(null);
  const [page, setPage] = useState(0);

  const finish = async () => {
    try { await AsyncStorage.setItem(ONBOARD_KEY, "1"); } catch {}
    // Replaying the tour while signed in returns to the app, not the login page.
    router.replace(user ? "/(tabs)" : "/login");
  };
  const goTo = (i: number) => list.current?.scrollToOffset({ offset: i * W, animated: true });

  /* ---- page 1: welcome ---- */
  const Welcome = (
    <ScrollView style={{ width: W }} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 26, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Shield size={46} />
        <Text style={s.wordmark}>DRILL<Text style={{ color: C.primary }}>GUARD</Text></Text>
        <Text style={s.tagline}>DRILL SMART. MONITOR RISK. PROTECT LIVES.</Text>
      </View>

      <Text style={s.h1}>
        Smarter drilling.{"\n"}<Text style={{ color: C.primary }}>Safer</Text> operations.
      </Text>
      <Text style={s.body}>
        DrillGuard uses real-time data and AI to detect risks early, alert your team
        instantly, and help you prevent costly drilling problems.
      </Text>

      {/* hero: rig + live cards */}
      <View style={{ marginTop: 16 }}>
        <HeroRig />
        <View style={s.riskCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={s.cardKicker}>RISK SCORE  ⓘ</Text>
            <View style={s.highChipSm}><Text style={s.highChipSmText}>High</Text></View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 2 }}>
            <Text style={s.riskNum}>76<Text style={s.riskDen}>/100</Text></Text>
            <RiskSpark />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            {["08:00", "09:00", "10:00", "Now"].map((t) => <Text key={t} style={s.axisLabel}>{t}</Text>)}
          </View>
          <View style={s.alertRow}>
            <Text style={s.cardKicker}>ACTIVE ALERT</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
              <View style={s.alertDot}><Ionicons name="warning" size={13} color="#fff" /></View>
              <View>
                <Text style={s.alertRowTitle}>Stuck Pipe Risk</Text>
                <Text style={s.alertRowMeta}>Depth: 1,659 m MD · 10:24 AM</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* feature grid */}
      <View style={s.featGrid}>
        <View style={{ flexDirection: "row" }}>
          <FeatureCell icon={<Ionicons name="pulse" size={17} color={C.primary} />} tint={C.primary} bg={C.primarySoft}
            title="Real-time Monitoring" sub="Continuously track key drilling parameters." />
          <View style={s.featDividerV} />
          <FeatureCell icon={<Ionicons name="warning" size={16} color={C.medium} />} tint={C.medium} bg={C.mediumSoft}
            title="Early Risk Detection" sub="AI models find subtle patterns before problems." />
        </View>
        <View style={s.featDividerH} />
        <View style={{ flexDirection: "row" }}>
          <FeatureCell icon={<Ionicons name="notifications" size={16} color={C.good} />} tint={C.good} bg={C.goodSoft}
            title="Instant Alerts" sub="Get actionable alerts wherever you are." />
          <View style={s.featDividerV} />
          <FeatureCell icon={<Ionicons name="bar-chart" size={16} color="#7c3aed" />} tint="#7c3aed" bg="#f1eafd"
            title="Better Decisions" sub="See insights that help you act with confidence." />
        </View>
      </View>

      <Pressable onPress={finish} style={s.primaryBtn}>
        <Text style={s.primaryBtnText}>Get Started</Text>
      </Pressable>
      <Pressable onPress={() => goTo(1)} style={s.outlineBtn}>
        <Text style={s.outlineBtnText}>See How It Works</Text>
      </Pressable>
      <View style={{ alignItems: "center", marginTop: 16 }}><Dots page={0} /></View>
    </ScrollView>
  );

  /* ---- tour page scaffold ---- */
  const Tour = ({ children, headA, headB, copy, last, idx, footer }: {
    children: React.ReactNode; headA: string; headB: string; copy: string; last?: boolean; idx: number; footer?: React.ReactNode;
  }) => (
    <View style={{ width: W, flex: 1, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) }}>
      <View style={{ alignItems: "center" }}><Shield size={34} /></View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        {children}
        <Text style={[s.h1, { textAlign: "center", marginTop: 8 }]}>
          {headA}{"\n"}<Text style={{ color: C.primary }}>{headB}</Text>
        </Text>
        <Text style={[s.body, { textAlign: "center", paddingHorizontal: 30 }]}>{copy}</Text>
        {footer}
      </View>
      <View style={s.tourBar}>
        <Pressable onPress={finish} hitSlop={10}><Text style={s.skip}>Skip</Text></Pressable>
        <Dots page={idx} />
        <Pressable onPress={() => (last ? finish() : goTo(idx + 1))} style={s.nextBtn}>
          <Text style={s.nextText}>{last ? "Let's Go" : "Next"}</Text>
        </Pressable>
      </View>
    </View>
  );

  const pages = [
    { key: "welcome", node: Welcome },
    {
      key: "realtime",
      node: (
        <Tour idx={1} headA="Real-time" headB="visibility." copy="Continuously monitor critical drilling parameters in real time with second-by-second updates."
          footer={
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 22, paddingHorizontal: 16 }}>
              <ParamIcon icon={<MaterialCommunityIcons name="rotate-right" size={20} color={C.primary} />} label="Torque" />
              <ParamIcon icon={<MaterialCommunityIcons name="hook" size={20} color={C.primary} />} label="Hookload" />
              <ParamIcon icon={<Ionicons name="speedometer-outline" size={20} color={C.primary} />} label="RPM" />
              <ParamIcon icon={<Ionicons name="water-outline" size={20} color={C.primary} />} label="Flow In" />
              <ParamIcon icon={<MaterialCommunityIcons name="gauge" size={20} color={C.primary} />} label="Standpipe" />
            </View>
          }>
          <MonitorIllo />
        </Tour>
      ),
    },
    {
      key: "alerts",
      node: (
        <Tour idx={2} headA="Instant alerts." headB="Anywhere." copy="Get AI-powered alerts the moment a risk is detected — in the app and by SMS to the crew phone.">
          <AlertPhoneIllo />
        </Tour>
      ),
    },
    {
      key: "insights",
      node: (
        <Tour idx={3} last headA="Insights that" headB="drive results." copy="Understand trends, analyze performance, and generate reports that help you make better decisions."
          footer={
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 22 }}>
              <ParamIcon icon={<Ionicons name="trending-up" size={20} color={C.primary} />} label="Trend Analysis" />
              <ParamIcon icon={<Ionicons name="document-text-outline" size={20} color={C.primary} />} label="Well Reports" />
              <ParamIcon icon={<Ionicons name="download-outline" size={20} color={C.primary} />} label="Export Data" />
              <ParamIcon icon={<Ionicons name="people-outline" size={20} color={C.primary} />} label="Team Sharing" />
            </View>
          }>
          <InsightsIllo />
        </Tour>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        ref={list}
        data={pages}
        keyExtractor={(p) => p.key}
        renderItem={({ item }) => <View style={{ width: W, flex: 1 }}>{item.node}</View>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        bounces={false}
      />
    </View>
  );
}

/* ---------------------------------------------------------------- styles */
const s = StyleSheet.create({
  wordmark: { fontSize: 26, fontWeight: "900", letterSpacing: 0.5, color: C.navy },
  tagline: { fontSize: 9.5, fontWeight: "700", letterSpacing: 1.1, color: C.muted },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: C.text, textAlign: "center", marginTop: 18 },
  body: { fontSize: 14.5, lineHeight: 21, color: C.text2, textAlign: "center", marginTop: 10 },

  riskCard: {
    marginTop: -44, marginHorizontal: 14, backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 14,
    shadowColor: C.navy, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardKicker: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6, color: C.muted },
  riskNum: { fontSize: 34, fontWeight: "900", color: C.text },
  riskDen: { fontSize: 15, fontWeight: "700", color: C.muted },
  axisLabel: { fontSize: 9.5, color: C.muted2 },
  highChipSm: { backgroundColor: C.highSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  highChipSmText: { color: C.high, fontSize: 10.5, fontWeight: "800" },
  alertRow: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 12, paddingTop: 10 },
  alertDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.high, alignItems: "center", justifyContent: "center" },
  alertRowTitle: { fontSize: 13.5, fontWeight: "800", color: C.text },
  alertRowMeta: { fontSize: 11.5, color: C.muted, marginTop: 1 },

  featGrid: { marginTop: 16, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 4 },
  featCell: { flex: 1, flexDirection: "row", gap: 9, padding: 12 },
  featIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  featTitle: { fontSize: 12.5, fontWeight: "800", color: C.text },
  featSub: { fontSize: 10.5, color: C.muted, marginTop: 2, lineHeight: 14 },
  featDividerV: { width: 1, backgroundColor: C.border, marginVertical: 8 },
  featDividerH: { height: 1, backgroundColor: C.border, marginHorizontal: 12 },

  primaryBtn: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
  outlineBtn: { marginTop: 10, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  outlineBtnText: { color: C.primary, fontSize: 15, fontWeight: "800" },

  tourBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 6 },
  skip: { fontSize: 14.5, fontWeight: "600", color: C.muted },
  nextBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 26, height: 46, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  paramCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.surface, borderWidth: 1,
    borderColor: C.border, alignItems: "center", justifyContent: "center",
  },
  paramLabel: { fontSize: 10.5, color: C.text2, fontWeight: "600", textAlign: "center" },
});

const illo = StyleSheet.create({
  monitor: {
    position: "absolute", left: 22, top: 26, backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, padding: 12,
    shadowColor: C.navy, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  lineWide: { height: 6, width: 120, borderRadius: 3, backgroundColor: C.surface2 },
  lineMid: { height: 6, width: 92, borderRadius: 3, backgroundColor: C.surface2 },
  lineNarrow: { height: 6, width: 64, borderRadius: 3, backgroundColor: C.surface2 },
  drillWrap: { position: "absolute", right: 52, top: 10 },
  chip: {
    position: "absolute", backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: C.navy, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  chipLabel: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.5, color: C.muted },
  chipValue: { fontSize: 15, fontWeight: "900", color: C.text },
  chipUnit: { fontSize: 10, fontWeight: "700", color: C.muted },

  phone: {
    width: 224, borderRadius: 28, backgroundColor: C.surface, borderWidth: 6, borderColor: C.navy,
    paddingBottom: 16, shadowColor: C.navy, shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  phoneNotch: { alignSelf: "center", width: 70, height: 8, borderRadius: 4, backgroundColor: C.navy, marginTop: 8 },
  alertTri: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.high, alignItems: "center", justifyContent: "center" },
  alertKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: C.muted, marginTop: 5 },
  alertTitle: { fontSize: 15.5, fontWeight: "900", color: C.text },
  highChip: { backgroundColor: C.highSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  highChipText: { color: C.high, fontSize: 10, fontWeight: "800" },
  alertMeta: { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 15 },
  alertQ: { fontSize: 11, fontWeight: "800", color: C.text, marginTop: 8 },
  alertA: { fontSize: 11, color: C.text2, marginTop: 2, lineHeight: 15 },
  viewBtn: { marginTop: 12, height: 36, borderRadius: 9, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  viewBtnText: { color: "#fff", fontSize: 12.5, fontWeight: "800" },
  bubble: {
    position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center",
    shadowColor: C.navy, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },

  trendCard: {
    alignSelf: "center", marginLeft: -60, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 12, shadowColor: C.navy, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardKicker: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6, color: C.muted },
  summaryCard: {
    position: "absolute", left: 22, bottom: 8, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 12, shadowColor: C.navy, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  pdfCard: {
    position: "absolute", right: 20, bottom: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 12, transform: [{ rotate: "3deg" }],
    shadowColor: C.navy, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  pdfChip: { position: "absolute", right: -8, bottom: -8, backgroundColor: C.high, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pdfChipText: { color: "#fff", fontSize: 10, fontWeight: "900" },
});
