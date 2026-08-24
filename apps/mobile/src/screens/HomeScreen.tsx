import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { INDICATION_LABELS, scheduleWeeklyDose } from "@warfarin/dosing-engine";
import { usePatientStore } from "../store";
import { colors } from "../theme";

export function HomeScreen() {
  const { state } = usePatientStore();
  const latestInr = state.inrHistory.at(-1);
  const pending = state.recommendations.find((r) => r.status === "pending");
  const { plan } = scheduleWeeklyDose(state.weeklyDoseMg);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{state.name}</Text>
      <Text style={styles.subtitle}>{INDICATION_LABELS[state.indication]}</Text>

      {pending && (
        <View style={[styles.banner, pending.recommendation.urgent ? styles.bannerUrgent : styles.bannerPending]}>
          <Text style={styles.bannerText}>
            {pending.recommendation.urgent
              ? "Urgent: a recent INR result needs your care team's attention."
              : "Your latest INR result has a suggested dose update awaiting your care team's review."}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current approved weekly dose</Text>
        <Text style={styles.cardValue}>{state.weeklyDoseMg} mg / week</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Latest INR</Text>
        <Text style={styles.cardValue}>{latestInr ? latestInr.value.toFixed(1) : "—"}</Text>
        {latestInr && (
          <Text style={styles.cardHint}>{new Date(latestInr.takenAt).toLocaleDateString()}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>This week's schedule</Text>
        {plan.map((entry) => (
          <View key={entry.day} style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>{entry.day}</Text>
            <Text style={styles.scheduleDose}>{entry.doseMg} mg</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        This app supports, but does not replace, your prescriber. Never change your dose based on this app alone —
        always follow your care team's confirmed instructions.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  banner: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 4 },
  bannerPending: { backgroundColor: colors.pendingBg, borderColor: "#f59e0b" },
  bannerUrgent: { backgroundColor: colors.urgentBg, borderColor: colors.urgentBorder },
  bannerText: { fontSize: 13, color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardLabel: { fontSize: 12, color: colors.muted, marginBottom: 4, textTransform: "uppercase" },
  cardValue: { fontSize: 22, fontWeight: "700", color: colors.text },
  cardHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scheduleDay: { fontSize: 14, color: colors.text, fontWeight: "600" },
  scheduleDose: { fontSize: 14, color: colors.muted },
  disclaimer: { fontSize: 11, color: colors.muted, marginTop: 8, lineHeight: 16 },
});
