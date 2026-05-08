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

export default function CouponManagerScreen() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [type, setType] = useState("percentage");
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    const snap = await getDocs(collection(db, "coupons"));
    setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleAdd = async () => {
    if (!code.trim() || !discount) {
      Toast.show({ type: "error", text1: "Code and discount required" });
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "coupons"), {
        code: code.trim().toUpperCase(),
        discount: parseFloat(discount),
        type,
        active: true,
        createdAt: serverTimestamp(),
      });
      Toast.show({ type: "success", text1: "Coupon created" });
      setCode("");
      setDiscount("");
      loadCoupons();
    } catch {
      Toast.show({ type: "error", text1: "Failed to create coupon" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, c) => {
    Alert.alert("Delete Coupon", `Delete coupon "${c}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "coupons", id));
          Toast.show({ type: "success", text1: "Deleted" });
          loadCoupons();
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
          <Text style={styles.sectionTitle}>New Coupon</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Coupon code (e.g. SAVE10)"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={discount}
              onChangeText={setDiscount}
              placeholder="Discount value"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "percentage" && styles.typeBtnActive,
              ]}
              onPress={() => setType("percentage")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "percentage" && { color: "#fff" },
                ]}
              >
                %
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === "fixed" && styles.typeBtnActive]}
              onPress={() => setType("fixed")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "fixed" && { color: "#fff" },
                ]}
              >
                M
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Add Coupon</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#111827" style={{ margin: 20 }} />
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View>
                  <Text style={styles.couponCode}>{item.code}</Text>
                  <Text style={styles.couponDetail}>
                    {item.discount}
                    {item.type === "percentage" ? "%" : " M"} off
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.code)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ padding: 12, paddingTop: 4 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No coupons yet.</Text>
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
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  typeBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  typeBtnText: { fontWeight: "700", color: "#374151" },
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
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  couponCode: { fontSize: 15, fontWeight: "700", color: "#111827" },
  couponDetail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 20, fontSize: 14 },
});
