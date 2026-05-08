import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function AdminAccountScreen() {
  const { admin, setAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    setAdmin(null);
    Toast.show({ type: "info", text1: "Signed out" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(admin?.name || admin?.email || "A")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{admin?.name || "Admin"}</Text>
        <Text style={styles.email}>{admin?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Administrator</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#111827" },
  email: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  roleBadge: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  roleText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#fee2e2",
    elevation: 1,
  },
  signOutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
