import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const STATUSES = [
  "Placed",
  "Approved",
  "Packed",
  "Shipped",
  "Delivered",
  "Declined",
  "Cancelled",
  "Refunded",
];
const STATUS_COLORS = {
  Placed: "#3b82f6",
  Approved: "#f59e0b",
  Packed: "#8b5cf6",
  Shipped: "#6366f1",
  Delivered: "#16a34a",
  Declined: "#ef4444",
  Cancelled: "#ef4444",
  Refunded: "#6b7280",
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "orders", orderId));
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [orderId]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const historyEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Status updated to ${newStatus} by admin`,
        updatedBy: "admin",
      };
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [...(order.statusHistory || []), historyEntry],
      });
      setOrder((prev) => ({
        ...prev,
        status: newStatus,
        statusHistory: [...(prev.statusHistory || []), historyEntry],
      }));
      Toast.show({ type: "success", text1: `Status updated to ${newStatus}` });
    } catch {
      Toast.show({ type: "error", text1: "Failed to update status" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  if (!order)
    return (
      <View style={styles.center}>
        <Text>Order not found.</Text>
      </View>
    );

  const color = STATUS_COLORS[order.status] || "#6b7280";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>
            #{orderId.slice(-8).toUpperCase()}
          </Text>
          <View style={[styles.badge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.badgeText, { color }]}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.infoText}>
          Date:{" "}
          {order.createdAt?.seconds
            ? new Date(order.createdAt.seconds * 1000).toLocaleString()
            : "N/A"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        {[
          ["Name", order.userName || order.customerName],
          ["Email", order.userEmail || order.email],
          ["Phone", order.userPhone || order.phone],
        ].map(([l, v]) =>
          v ? (
            <Text key={l} style={styles.infoText}>
              {l}: {v}
            </Text>
          ) : null,
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {order.shippingAddress &&
          Object.entries(order.shippingAddress).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.infoText}>
                {k.charAt(0).toUpperCase() + k.slice(1)}: {v}
              </Text>
            ) : null,
          )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items || []).map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              M {(parseFloat(item.price) * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.infoText}>Subtotal</Text>
          <Text style={styles.infoText}>
            M {parseFloat(order.subtotal || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.infoText}>Shipping</Text>
          <Text style={styles.infoText}>
            M{" "}
            {parseFloat(order.shipping?.cost || order.shipping || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>
            M{" "}
            {parseFloat(
              order.totalAmount || order.total || order.financials?.total || 0,
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusGrid}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                order.status === s && styles.statusBtnActive,
                { borderColor: STATUS_COLORS[s] },
              ]}
              onPress={() => updateStatus(s)}
              disabled={updating || order.status === s}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  order.status === s && { color: "#fff" },
                  { color: order.status === s ? "#fff" : STATUS_COLORS[s] },
                ]}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: "#374151", marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  itemName: { flex: 1, fontSize: 13, color: "#374151" },
  itemQty: { fontSize: 13, color: "#6b7280", marginHorizontal: 8 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: "#111827" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: "#fff",
  },
  statusBtnActive: {},
  statusBtnText: { fontSize: 13, fontWeight: "600" },
});
