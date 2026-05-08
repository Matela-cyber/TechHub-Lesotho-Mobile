import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTACT_INFO = [
  {
    icon: "call-outline",
    label: "Phone",
    value: "+266 5000 0000",
    action: () => Linking.openURL("tel:+26650000000"),
  },
  {
    icon: "mail-outline",
    label: "Email",
    value: "info@techhub.co.ls",
    action: () => Linking.openURL("mailto:info@techhub.co.ls"),
  },
  {
    icon: "logo-whatsapp",
    label: "WhatsApp",
    value: "+266 5000 0000",
    action: () => Linking.openURL("https://wa.me/26650000000"),
  },
  {
    icon: "location-outline",
    label: "Address",
    value: "Maseru, Lesotho",
    action: null,
  },
];

export default function ContactScreen() {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!formName.trim() || !formEmail.trim() || !formMsg.trim()) {
      Toast.show({ type: "error", text1: "Please fill in all fields" });
      return;
    }
    setSending(true);
    try {
      // Open default email client as fallback
      const mailto = `mailto:info@techhub.co.ls?subject=Contact from ${encodeURIComponent(formName)}&body=${encodeURIComponent(`Name: ${formName}\nEmail: ${formEmail}\n\nMessage:\n${formMsg}`)}`;
      await Linking.openURL(mailto);
      setFormName("");
      setFormEmail("");
      setFormMsg("");
      Toast.show({
        type: "success",
        text1: "Message composed!",
        text2: "Send it from your email app.",
      });
    } catch (e) {
      Toast.show({ type: "error", text1: "Could not open email client" });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.hero}>
          <Ionicons name="mail-outline" size={44} color="#fff" />
          <Text style={styles.heroTitle}>Contact Us</Text>
          <Text style={styles.heroSub}>We'd love to hear from you</Text>
        </View>

        <View style={styles.body}>
          {/* Contact cards */}
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactGrid}>
            {CONTACT_INFO.map((c) => (
              <TouchableOpacity
                key={c.label}
                style={styles.contactCard}
                onPress={c.action || undefined}
                disabled={!c.action}
              >
                <View style={styles.contactIconWrap}>
                  <Ionicons name={c.icon} size={22} color="#111827" />
                </View>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactValue}>{c.value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Business hours */}
          <View style={styles.hoursCard}>
            <Ionicons name="time-outline" size={20} color="#111827" />
            <View style={{ flex: 1 }}>
              <Text style={styles.hoursTitle}>Business Hours</Text>
              {[
                { day: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
                { day: "Saturday", time: "9:00 AM – 2:00 PM" },
                { day: "Sunday", time: "Closed" },
              ].map((h) => (
                <View key={h.day} style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>{h.day}</Text>
                  <Text style={styles.hoursTime}>{h.time}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact form */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
            Send a Message
          </Text>
          <View style={styles.form}>
            {[
              {
                label: "Your Name",
                value: formName,
                onChange: setFormName,
                placeholder: "Full name",
                keyboard: "default",
                capitalize: "words",
              },
              {
                label: "Email",
                value: formEmail,
                onChange: setFormEmail,
                placeholder: "you@example.com",
                keyboard: "email-address",
                capitalize: "none",
              },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType={f.keyboard}
                  autoCapitalize={f.capitalize}
                  autoCorrect={false}
                />
              </View>
            ))}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={formMsg}
                onChangeText={setFormMsg}
                placeholder="How can we help you?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.sendTxt}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 48 },
  hero: {
    backgroundColor: "#111827",
    padding: 36,
    alignItems: "center",
    gap: 8,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 13, color: "#9ca3af" },
  body: { padding: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  contactCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    elevation: 1,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  contactValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  hoursCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    elevation: 1,
    alignItems: "flex-start",
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  hoursDay: { fontSize: 13, color: "#374151" },
  hoursTime: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: "#111827",
  },
  messageInput: { minHeight: 100, textAlignVertical: "top" },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  sendTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
