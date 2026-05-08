import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import {
  updatePassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "../redux/userSlice";
import { clearWishlist } from "../redux/wishlistSlice";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (p) =>
  `M${Number(p || 0).toLocaleString("en-LS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ORDER_STATUSES = ["Placed", "Approved", "Packed", "Shipped", "Delivered"];

export default function ProfileScreen({ navigation }) {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [tab, setTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Profile edit — use name from Firestore (matches web)
  const [displayName, setDisplayName] = useState(
    user.name || user.displayName || "",
  );
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);

  // Fetch profile from Firestore on mount to get latest name/phone
  useEffect(() => {
    if (!user.uid) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setDisplayName(d.name || user.displayName || "");
          setPhone(d.phone || "");
        }
      })
      .catch(() => {});
  }, [user.uid]);

  // Change password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  // Query GLOBAL orders collection with where("userId","==",uid) — matches web
  useEffect(() => {
    if (tab === "orders" && user.uid) {
      setOrdersLoading(true);
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setOrders(data);
          setOrdersLoading(false);
        },
        () => {
          // Fallback without orderBy if index missing
          const q2 = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
          );
          const unsub2 = onSnapshot(
            q2,
            (snap) => {
              const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              data.sort((a, b) => {
                const ta = a.createdAt?.seconds || a.createdAt || 0;
                const tb = b.createdAt?.seconds || b.createdAt || 0;
                return tb - ta;
              });
              setOrders(data);
              setOrdersLoading(false);
            },
            () => setOrdersLoading(false),
          );
          return unsub2;
        },
      );
      return unsub;
    }
  }, [tab, user.uid]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Toast.show({ type: "error", text1: "Name cannot be empty" });
      return;
    }
    setSaving(true);
    try {
      // Use 'name' field — matches web (not 'displayName')
      await updateDoc(doc(db, "users", user.uid), {
        name: displayName.trim(),
        phone: phone.trim(),
      });
      dispatch(
        setUser({
          ...user,
          displayName: displayName.trim(),
          name: displayName.trim(),
          phone: phone.trim(),
        }),
      );
      Toast.show({ type: "success", text1: "Profile updated!" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Toast.show({ type: "error", text1: "Fill in both password fields" });
      return;
    }
    if (newPwd.length < 8) {
      Toast.show({
        type: "error",
        text1: "New password must be at least 8 characters",
      });
      return;
    }
    setChangingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setCurrentPwd("");
      setNewPwd("");
      Toast.show({ type: "success", text1: "Password changed successfully!" });
    } catch (e) {
      const msg =
        e.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : "Failed to change password.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          dispatch(clearUser());
          dispatch(clearWishlist());
          Toast.show({ type: "info", text1: "Signed out" });
        },
      },
    ]);
  };

  const getStatusIndex = (status) => ORDER_STATUSES.indexOf(status);

  const TABS = [
    { key: "profile", icon: "person-outline", label: "Profile" },
    { key: "orders", icon: "bag-outline", label: "Orders" },
    { key: "security", icon: "shield-outline", label: "Security" },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      {/* Avatar header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={36} color="#fff" />
        </View>
        <Text style={styles.userName}>
          {user.name || user.displayName || "User"}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon}
              size={18}
              color={tab === t.key ? "#fff" : "#6b7280"}
            />
            <Text style={[styles.tabTxt, tab === t.key && styles.tabTxtActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Profile tab */}
        {tab === "profile" && (
          <View>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user.email}
                editable={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveTxt}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              <Text style={styles.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Orders tab */}
        {tab === "orders" && (
          <View>
            <Text style={styles.sectionTitle}>My Orders</Text>
            {ordersLoading ? (
              <ActivityIndicator
                size="large"
                color="#111827"
                style={{ marginTop: 32 }}
              />
            ) : orders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <Ionicons name="bag-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTxt}>No orders yet</Text>
                <TouchableOpacity
                  style={styles.shopBtn}
                  onPress={() => navigation.navigate("Products")}
                >
                  <Text style={styles.shopBtnTxt}>Start Shopping</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() =>
                    setExpandedOrder(
                      expandedOrder === order.id ? null : order.id,
                    )
                  }
                >
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderId} numberOfLines={1}>
                        #{order.id?.slice(0, 12)}...
                      </Text>
                      <Text style={styles.orderDate}>
                        {order.createdAt?.seconds
                          ? new Date(
                              order.createdAt.seconds * 1000,
                            ).toLocaleDateString()
                          : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            order.status === "Delivered"
                              ? "#dcfce7"
                              : order.status === "Declined"
                                ? "#fef2f2"
                                : "#fefce8",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTxt,
                          {
                            color:
                              order.status === "Delivered"
                                ? "#16a34a"
                                : order.status === "Declined"
                                  ? "#dc2626"
                                  : "#ca8a04",
                          },
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>
                    {formatPrice(order.total)}
                  </Text>

                  {expandedOrder === order.id && (
                    <View style={styles.orderDetails}>
                      {/* Status timeline */}
                      <View style={styles.timeline}>
                        {ORDER_STATUSES.map((s, i) => {
                          const done = i <= getStatusIndex(order.status);
                          return (
                            <View key={s} style={styles.timelineItem}>
                              <View
                                style={[
                                  styles.timelineDot,
                                  done && styles.timelineDotDone,
                                ]}
                              />
                              {i < ORDER_STATUSES.length - 1 && (
                                <View
                                  style={[
                                    styles.timelineLine,
                                    done && styles.timelineLineDone,
                                  ]}
                                />
                              )}
                              <Text
                                style={[
                                  styles.timelineLabel,
                                  done && styles.timelineLabelDone,
                                ]}
                              >
                                {s}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      {/* Items */}
                      {order.items?.map((item, i) => (
                        <View key={i} style={styles.orderItem}>
                          <Text style={styles.orderItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.orderItemQty}>
                            ×{item.quantity}
                          </Text>
                          <Text style={styles.orderItemPrice}>
                            {formatPrice(item.price * item.quantity)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Security tab */}
        {tab === "security" && (
          <View>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="Current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="New password (min 6 chars)"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
              disabled={changingPwd}
            >
              {changingPwd ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveTxt}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    backgroundColor: "#111827",
    paddingVertical: 24,
    gap: 4,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  userEmail: { fontSize: 13, color: "#9ca3af" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#111827", backgroundColor: "#111827" },
  tabTxt: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  tabTxtActive: { color: "#fff" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  field: { marginBottom: 14 },
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
  inputDisabled: { backgroundColor: "#f3f4f6", color: "#9ca3af" },
  saveBtn: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 8,
    backgroundColor: "#fef2f2",
  },
  signOutTxt: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
  emptyOrders: { alignItems: "center", gap: 10, marginTop: 24 },
  emptyTxt: { fontSize: 16, color: "#9ca3af", fontWeight: "600" },
  shopBtn: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  shopBtnTxt: { color: "#fff", fontWeight: "700" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  orderId: { fontSize: 13, fontWeight: "700", color: "#111827" },
  orderDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  orderTotal: { fontSize: 16, fontWeight: "800", color: "#111827" },
  orderDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timelineItem: { alignItems: "center", flex: 1 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e5e7eb",
    marginBottom: 4,
  },
  timelineDotDone: { backgroundColor: "#22c55e" },
  timelineLine: {
    position: "absolute",
    top: 4,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#e5e7eb",
  },
  timelineLineDone: { backgroundColor: "#22c55e" },
  timelineLabel: { fontSize: 9, color: "#9ca3af", textAlign: "center" },
  timelineLabelDone: { color: "#22c55e", fontWeight: "600" },
  orderItem: { flexDirection: "row", paddingVertical: 4 },
  orderItemName: { flex: 1, fontSize: 12, color: "#374151" },
  orderItemQty: { fontSize: 12, color: "#9ca3af", marginHorizontal: 6 },
  orderItemPrice: { fontSize: 12, fontWeight: "700", color: "#111827" },
});
