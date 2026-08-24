import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { usePatientStore } from "../store";
import { colors } from "../theme";

const ACTION_LABELS: Record<string, string> = {
  continue_same_dose: "Continue same dose",
  increase_dose: "Increase dose",
  decrease_dose: "Decrease dose",
  hold_doses: "Hold dose(s)",
  hold_and_decrease: "Hold dose(s) and decrease",
  hold_and_seek_urgent_care: "Hold warfarin — urgent care",
  seek_emergency_care: "Seek emergency care",
};

export function LogInrScreen() {
  const { state, addInrReading, confirmRecommendation } = usePatientStore();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 20) {
      setError("Enter a plausible INR value (e.g. between 0.5 and 20).");
      return;
    }
    setError(null);
    addInrReading(parsed);
    setValue("");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log an INR result</Text>
      <Text style={styles.hint}>
        Enter the result from your lab or home meter. This will show you the guideline-based suggestion, but your
        care team must confirm any dose change before it takes effect.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
          placeholder="e.g. 2.6"
        />
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Check</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}

      {state.recommendations.map((r) => (
        <View
          key={r.id}
          style={[styles.card, r.recommendation.urgent ? styles.cardUrgent : undefined]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardAction}>{ACTION_LABELS[r.recommendation.action] ?? r.recommendation.action}</Text>
            <Text style={styles.cardMeta}>INR {r.basedOnInr.toFixed(1)}</Text>
          </View>
          <Text style={styles.rationale}>{r.recommendation.rationale}</Text>
          {r.recommendation.newWeeklyDoseMg !== undefined && (
            <Text style={styles.suggested}>Suggested: {r.recommendation.newWeeklyDoseMg} mg/week</Text>
          )}
          <Text style={styles.status}>
            {r.status === "pending" ? "Pending your care team's review — do not change your dose yet." : "Confirmed by your care team."}
          </Text>
          {r.status === "pending" && (
            <Pressable style={styles.confirmButton} onPress={() => confirmRecommendation(r.id)}>
              <Text style={styles.confirmButtonText}>Demo only: simulate clinic confirmation</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  button: { backgroundColor: colors.brand, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  buttonText: { color: "white", fontWeight: "600" },
  error: { color: colors.urgentText, fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  cardUrgent: { borderColor: colors.urgentBorder, backgroundColor: colors.urgentBg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardAction: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.muted },
  rationale: { fontSize: 13, color: colors.text, lineHeight: 18 },
  suggested: { fontSize: 13, fontWeight: "600", color: colors.brandDark },
  status: { fontSize: 12, color: colors.muted, fontStyle: "italic" },
  confirmButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confirmButtonText: { fontSize: 11, color: colors.muted },
});
