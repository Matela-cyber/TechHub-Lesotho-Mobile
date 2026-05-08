import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";

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

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orders"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setOrders(list);
      setFiltered(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    if (activeFilter !== "all")
      result = result.filter((o) => o.status === activeFilter);
    if (search.trim())
      result = result.filter(
        (o) =>
          (o.id || o.orderId || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (o.userName || o.customerName || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (o.userEmail || o.email || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    setFiltered(result);
  }, [search, activeFilter, orders]);

  const filters = [
    "all",
    "Placed",
    "Approved",
    "Packed",
    "Shipped",
    "Delivered",
    "Declined",
    "Cancelled",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search orders..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <FlatList
        horizontal
        data={filters}
        keyExtractor={(f) => f}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFilter === item && styles.filterBtnActive,
            ]}
            onPress={() => setActiveFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === item && styles.filterTextActive,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        showsHorizontalScrollIndicator={false}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => {
            const color = STATUS_COLORS[item.status] || "#6b7280";
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate("OrderDetail", { orderId: item.id })
                }
                activeOpacity={0.8}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    #{item.id.slice(-8).toUpperCase()}
                  </Text>
                  <View
                    style={[styles.badge, { backgroundColor: color + "22" }]}
                  >
                    <Text style={[styles.badgeText, { color }]}>
                      {item.status?.charAt(0).toUpperCase() +
                        item.status?.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customer}>
                  {item.userName ||
                    item.customerName ||
                    item.userEmail ||
                    item.email ||
                    "Unknown"}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.date}>
                    {item.createdAt?.seconds
                      ? new Date(
                          item.createdAt.seconds * 1000,
                        ).toLocaleDateString()
                      : ""}
                  </Text>
                  <Text style={styles.total}>
                    M{" "}
                    {parseFloat(
                      item.totalAmount ||
                        item.total ||
                        item.financials?.total ||
                        0,
                    ).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No orders found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#111827" },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  filterText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontSize: 14, fontWeight: "700", color: "#111827" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  customer: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  date: { fontSize: 12, color: "#9ca3af" },
  total: { fontSize: 14, fontWeight: "700", color: "#111827" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
});
