import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function ProductManagerScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "products"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setProducts(list);
    setFiltered(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q),
      ),
    );
  }, [search, products]);

  const handleDelete = (productId, name) => {
    Alert.alert("Delete Product", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "products", productId));
          Toast.show({ type: "success", text1: "Product deleted" });
          loadProducts();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate("AddProduct", { onAdded: loadProducts })
          }
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.images?.[0] || item.image ? (
                <Image
                  source={{ uri: item.images?.[0] || item.image }}
                  style={styles.img}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.img, styles.imgPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color="#d1d5db" />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.price}>
                  M {parseFloat(item.price || 0).toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.stock,
                    { color: item.stock > 0 ? "#16a34a" : "#ef4444" },
                  ]}
                >
                  {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                </Text>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate("EditProduct", {
                      productId: item.id,
                      onUpdated: loadProducts,
                    })
                  }
                >
                  <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No products found.</Text>
          }
          onRefresh={loadProducts}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", padding: 12, gap: 8, alignItems: "center" },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: "#111827" },
  addBtn: {
    backgroundColor: "#111827",
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    elevation: 1,
  },
  img: { width: 72, height: 72, borderRadius: 8 },
  imgPlaceholder: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "600", color: "#111827" },
  category: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  price: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },
  stock: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  actionCol: { justifyContent: "space-around", paddingLeft: 4 },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
});
