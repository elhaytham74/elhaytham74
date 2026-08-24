import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { usePatientStore } from "../store";
import { colors } from "../theme";

export function ChatScreen() {
  const { state, sendPatientMessage } = usePatientStore();
  const [draft, setDraft] = useState("");

  function submit() {
    if (!draft.trim()) return;
    sendPatientMessage(draft.trim());
    setDraft("");
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {state.chatMessages.length === 0 && (
          <Text style={styles.emptyHint}>
            Ask about missed doses, diet, or why your dose changed. Anything urgent is flagged to your care team.
          </Text>
        )}
        {state.chatMessages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.from === "patient"
                ? styles.bubblePatient
                : m.urgent
                ? styles.bubbleUrgent
                : styles.bubbleAssistant,
            ]}
          >
            <Text style={styles.bubbleLabel}>
              {m.from === "patient" ? "You" : "Care assistant"}
              {m.escalated ? " · flagged for your clinic" : ""}
            </Text>
            <Text style={m.from === "patient" ? styles.bubbleTextLight : styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          onSubmitEditing={submit}
        />
        <Pressable style={styles.sendButton} onPress={submit}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 8 },
  emptyHint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  bubble: { maxWidth: "85%", borderRadius: 12, padding: 10 },
  bubblePatient: { alignSelf: "flex-end", backgroundColor: colors.brand },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: "#f1f5f9" },
  bubbleUrgent: { alignSelf: "flex-start", backgroundColor: colors.urgentBg, borderWidth: 1, borderColor: colors.urgentBorder },
  bubbleLabel: { fontSize: 10, color: colors.muted, marginBottom: 2, textTransform: "uppercase" },
  bubbleText: { fontSize: 14, color: colors.text },
  bubbleTextLight: { fontSize: 14, color: "white" },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendButton: { backgroundColor: colors.brand, borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" },
  sendButtonText: { color: "white", fontWeight: "600" },
});
