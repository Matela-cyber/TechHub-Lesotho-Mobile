import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function AnnouncementManagerScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = async () => {
    const snap = await getDocs(collection(db, "announcements"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
    setAnnouncements(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleAdd = async () => {
    if (!message.trim()) {
      Toast.show({ type: "error", text1: "Enter an announcement message" });
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "announcements"), {
        message: message.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });
      Toast.show({ type: "success", text1: "Announcement published" });
      setMessage("");
      loadAnnouncements();
    } catch {
      Toast.show({ type: "error", text1: "Failed to publish" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Announcement", "Delete this announcement?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "announcements", id));
          Toast.show({ type: "success", text1: "Deleted" });
          loadAnnouncements();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>New Announcement</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="e.g. Free delivery this weekend!"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#111827" style={{ margin: 20 }} />
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Ionicons
                  name="megaphone-outline"
                  size={20}
                  color="#f59e0b"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.messageText} numberOfLines={3}>
                  {item.message}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ padding: 12, paddingTop: 4 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No announcements.</Text>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  addSection: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#111827",
    height: 80,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#6b7280" },
  btnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  messageText: { flex: 1, fontSize: 14, color: "#374151" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 20, fontSize: 14 },
});
