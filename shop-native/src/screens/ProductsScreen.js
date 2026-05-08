import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (p) =>
  `M${Number(p || 0).toLocaleString("en-LS", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function ProductCard({ product, onPress, onAddToCart }) {
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : product.discount || 0;
  const imageUrl = product.images?.[0] || product.image || null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imgWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImg}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noImg}>
            <Ionicons name="image-outline" size={36} color="#d1d5db" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{discount}% OFF</Text>
          </View>
        )}
        {product.stock <= 0 && (
          <View style={styles.oosBadge}>
            <Text style={styles.oosTxt}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand ? (
          <Text style={styles.cardBrand}>{product.brand}</Text>
        ) : null}
        {product.category ? (
          <Text style={styles.cardCat}>{product.category}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.mrp && product.mrp > product.price && (
            <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, product.stock <= 0 && styles.addBtnDisabled]}
          onPress={() => onAddToCart(product)}
          disabled={product.stock <= 0}
        >
          <Ionicons name="cart-outline" size={14} color="#fff" />
          <Text style={styles.addBtnTxt}>
            {product.stock <= 0 ? "Unavailable" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const dispatch = useDispatch();
  const user = useSelector((s) => s.user);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        price: parseFloat(d.data().price) || 0,
        mrp: d.data().mrp ? parseFloat(d.data().mrp) : null,
        stock: parseInt(d.data().stock, 10) || 0,
      }));
      setProducts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["All", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "All")
      list = list.filter((p) => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, search, selectedCategory]);

  const handleAddToCart = (product) => {
    if (!user.uid) {
      Toast.show({ type: "info", text1: "Sign in to add items to cart" });
      return;
    }
    if (product.stock <= 0) {
      Toast.show({ type: "error", text1: "Out of stock" });
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
    Toast.show({ type: "success", text1: `${product.name} added to cart` });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.catChip,
              selectedCategory === item && styles.catChipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.catChipTxt,
                selectedCategory === item && styles.catChipTxtActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#111827"
          style={{ marginTop: 60 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTxt}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("ProductView", { productId: item.id })
                }
                onAddToCart={handleAddToCart}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  catList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  catChipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  catChipTxt: { fontSize: 13, color: "#374151", fontWeight: "600" },
  catChipTxtActive: { color: "#fff" },
  grid: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  empty: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyTxt: { color: "#9ca3af", fontSize: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    flex: 1,
  },
  imgWrap: { position: "relative", height: 130, backgroundColor: "#f3f4f6" },
  cardImg: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#dc2626",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  oosBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#374151",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  oosTxt: { color: "#fff", fontSize: 9, fontWeight: "600" },
  cardBody: { padding: 10 },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
    lineHeight: 17,
  },
  cardBrand: { fontSize: 11, color: "#6b7280" },
  cardCat: { fontSize: 10, color: "#9ca3af", marginBottom: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  price: { fontSize: 15, fontWeight: "800", color: "#111827" },
  mrp: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 7,
  },
  addBtnDisabled: { backgroundColor: "#9ca3af" },
  addBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
