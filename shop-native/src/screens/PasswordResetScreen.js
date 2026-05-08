import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PasswordResetScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email" });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      Toast.show({
        type: "success",
        text1: "Reset email sent!",
        text2: "Check your inbox.",
      });
    } catch (e) {
      const msg =
        e.code === "auth/user-not-found"
          ? "No account found with this email."
          : e.code === "auth/invalid-email"
            ? "Invalid email address."
            : "Failed to send reset email. Try again.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons
              name={sent ? "checkmark-circle" : "lock-open-outline"}
              size={56}
              color={sent ? "#22c55e" : "#111827"}
            />
          </View>

          <Text style={styles.title}>
            {sent ? "Email Sent!" : "Reset Password"}
          </Text>
          <Text style={styles.subtitle}>
            {sent
              ? `We've sent a password reset link to ${email}. Check your inbox and follow the instructions.`
              : "Enter your email address and we'll send you a link to reset your password."}
          </Text>

          {!sent && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetTxt}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {sent && (
            <>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                <Text style={styles.retryTxt}>Try a different email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={() => navigation.navigate("SignIn")}
              >
                <Text style={styles.signInTxt}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
  },
  backTxt: { fontSize: 15, fontWeight: "600", color: "#111827" },
  iconWrap: { alignItems: "center", marginBottom: 20 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
  },
  resetBtn: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  resetTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  retryTxt: { color: "#374151", fontWeight: "600", fontSize: 15 },
  signInBtn: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  signInTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
