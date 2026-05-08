import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import Toast from "react-native-toast-message";

const MENU_ITEMS = [
  { icon: "people-outline", label: "Manage Users", screen: "Users" },
  {
    icon: "pricetag-outline",
    label: "Coupon Manager",
    screen: "CouponManager",
  },
  {
    icon: "megaphone-outline",
    label: "Announcements",
    screen: "AnnouncementManager",
  },
  {
    icon: "person-circle-outline",
    label: "My Account",
    screen: "AdminAccount",
  },
];

export default function MoreScreen() {
  const navigation = useNavigation();
  const { admin, setAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    setAdmin(null);
    Toast.show({ type: "info", text1: "Signed out" });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(admin?.name || admin?.email || "A")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.adminName}>{admin?.name || "Admin"}</Text>
        <Text style={styles.adminEmail}>{admin?.email}</Text>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={22} color="#1d4ed8" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color="#d1d5db"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { backgroundColor: "#1d4ed8", padding: 32, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#fff" },
  adminName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  adminEmail: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    overflow: "hidden",
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
    elevation: 1,
  },
  signOutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
