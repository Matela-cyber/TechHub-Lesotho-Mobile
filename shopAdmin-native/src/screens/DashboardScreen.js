import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "users")),
        ]);
        const allOrders = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const revenue = allOrders.reduce(
          (sum, o) =>
            sum +
            parseFloat(o.totalAmount || o.financials?.total || o.total || 0),
          0,
        );
        const sorted = [...allOrders]
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
          )
          .slice(0, 5);
        setStats({
          orders: ordersSnap.size,
          products: productsSnap.size,
          users: usersSnap.size,
          revenue,
        });
        setRecentOrders(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusColor = (s) =>
    ({
      Placed: "#3b82f6",
      Approved: "#f59e0b",
      Packed: "#8b5cf6",
      Shipped: "#6366f1",
      Delivered: "#16a34a",
      Declined: "#ef4444",
      Cancelled: "#ef4444",
      Refunded: "#6b7280",
    })[s] || "#6b7280";

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.welcomeSub}>Here's what's happening today</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <Ionicons name="storefront-outline" size={28} color="#1d4ed8" />
        </View>
      </View>
      <View style={styles.statsGrid}>
        {[
          {
            label: "Total Orders",
            value: stats.orders,
            icon: "receipt-outline",
            color: "#3b82f6",
          },
          {
            label: "Revenue (M)",
            value: `M ${stats.revenue.toFixed(0)}`,
            icon: "cash-outline",
            color: "#16a34a",
          },
          {
            label: "Products",
            value: stats.products,
            icon: "cube-outline",
            color: "#8b5cf6",
          },
          {
            label: "Users",
            value: stats.users,
            icon: "people-outline",
            color: "#f59e0b",
          },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: s.color + "22" }]}
            >
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderRow}
            onPress={() =>
              navigation.navigate("OrderDetail", { orderId: order.id })
            }
          >
            <View style={styles.orderLeft}>
              <Text style={styles.orderId}>
                #{order.id.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.orderCustomer}>
                {order.userName ||
                  order.customerName ||
                  order.userEmail ||
                  order.email ||
                  "Unknown"}
              </Text>
            </View>
            <View>
              <Text style={styles.orderTotal}>
                M{" "}
                {parseFloat(
                  order.totalAmount ||
                    order.financials?.total ||
                    order.total ||
                    0,
                ).toFixed(2)}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: statusColor(order.status) + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: statusColor(order.status) },
                  ]}
                >
                  {order.status?.charAt(0).toUpperCase() +
                    order.status?.slice(1)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.viewAll}
          onPress={() => navigation.navigate("Orders")}
        >
          <Text style={styles.viewAllText}>View All Orders →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeHeader: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  welcomeText: { fontSize: 18, fontWeight: "700", color: "#111827" },
  welcomeSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    margin: "1.5%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  orderLeft: {},
  orderId: { fontSize: 13, fontWeight: "700", color: "#111827" },
  orderCustomer: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  viewAll: { paddingTop: 12, alignItems: "center" },
  viewAllText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
});
