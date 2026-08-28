import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { C } from "@/lib/theme";
import { ONBOARD_KEY } from "./onboarding";

/** Entry gate: session read → app; first launch → onboarding; else → login. */
export default function Index() {
  const { user, ready } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARD_KEY)
      .then((v) => setOnboarded(v === "1"))
      .catch(() => setOnboarded(true)); // storage unavailable — don't trap the user in the tour
  }, []);

  if (!ready || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.navy }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href={onboarded ? "/login" : "/onboarding"} />;
}
