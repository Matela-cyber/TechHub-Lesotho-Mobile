import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (p) =>
  `M${Number(p || 0).toLocaleString("en-LS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderSummaryScreen({ navigation, route }) {
  const { orderId, total } = route.params || {};

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Thank you for your purchase. We'll process your order shortly.
        </Text>

        {orderId && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Order ID</Text>
            <Text style={styles.orderId}>{orderId}</Text>
          </View>
        )}

        {total !== undefined && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Paid</Text>
            <Text style={styles.totalVal}>{formatPrice(total)}</Text>
          </View>
        )}

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>What happens next?</Text>
          {[
            { icon: "checkmark-circle", label: "Order Placed", done: true },
            { icon: "thumbs-up-outline", label: "Approval", done: false },
            { icon: "cube-outline", label: "Packing", done: false },
            { icon: "car-outline", label: "Shipped", done: false },
            { icon: "home-outline", label: "Delivered", done: false },
          ].map((s, i) => (
            <View key={s.label} style={styles.statusRow}>
              <Ionicons
                name={s.icon}
                size={20}
                color={s.done ? "#22c55e" : "#d1d5db"}
              />
              <Text
                style={[styles.statusLabel, s.done && styles.statusLabelDone]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          You can track your order status in your Profile → Orders section.
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.homeTxt}>Continue Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ordersBtn}
          onPress={() => navigation.navigate("Tabs", { screen: "Account" })}
        >
          <Ionicons name="list-outline" size={18} color="#111827" />
          <Text style={styles.ordersTxt}>View My Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", paddingBottom: 48 },
  iconWrap: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "monospace",
  },
  totalVal: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statusCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  statusLabel: { fontSize: 14, color: "#9ca3af" },
  statusLabelDone: { color: "#22c55e", fontWeight: "700" },
  note: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  homeTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  ordersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  ordersTxt: { color: "#111827", fontWeight: "700", fontSize: 15 },
});
