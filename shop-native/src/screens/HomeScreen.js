import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
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

const formatPrice = (p) => {
  if (!p && p !== 0) return "M0";
  return `M${Number(p).toLocaleString("en-LS", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

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
            <Ionicons name="image-outline" size={40} color="#d1d5db" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{discount}% OFF</Text>
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
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.mrp && product.mrp > product.price && (
            <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
          )}
        </View>
        {product.stock <= 0 && (
          <Text style={styles.outOfStock}>Out of Stock</Text>
        )}
        <TouchableOpacity
          style={[styles.addBtn, product.stock <= 0 && styles.addBtnDisabled]}
          onPress={() => onAddToCart(product)}
          disabled={product.stock <= 0}
        >
          <Ionicons name="cart-outline" size={16} color="#fff" />
          <Text style={styles.addBtnTxt}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((s) => s.user);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const all = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        price: parseFloat(d.data().price) || 0,
        mrp: d.data().mrp ? parseFloat(d.data().mrp) : null,
        stock: parseInt(d.data().stock, 10) || 0,
      }));
      setProducts(all.filter((p) => p.showOnHome));
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
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProducts();
            }}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>TechHub Lesotho</Text>
            <Text style={styles.heroTitle}>Your Tech{"\n"}Destination</Text>
            <Text style={styles.heroSub}>
              Laptops, phones, accessories & more — delivered to you.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate("Products")}
            >
              <Text style={styles.heroBtnTxt}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {[
            { icon: "shield-checkmark-outline", label: "Genuine Products" },
            { icon: "rocket-outline", label: "Fast Delivery" },
            { icon: "headset-outline", label: "24/7 Support" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon} size={22} color="#111827" />
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Featured products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Products")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#111827"
              style={{ margin: 32 }}
            />
          ) : products.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTxt}>No featured products yet</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12 }}
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
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.quickLinks}>
            {[
              {
                label: "All Products",
                icon: "grid-outline",
                screen: "Products",
              },
              { label: "My Cart", icon: "cart-outline", screen: "Cart" },
              { label: "Wishlist", icon: "heart-outline", screen: "Wishlist" },
              {
                label: "My Account",
                icon: "person-outline",
                screen: "Account",
              },
            ].map((q) => (
              <TouchableOpacity
                key={q.label}
                style={styles.quickItem}
                onPress={() => navigation.navigate(q.screen)}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={q.icon} size={24} color="#111827" />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  hero: {
    backgroundColor: "#111827",
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  heroContent: {},
  heroLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSub: { color: "#d1d5db", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  heroBtnTxt: { color: "#111827", fontWeight: "700", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    justifyContent: "space-around",
    marginBottom: 8,
    elevation: 1,
  },
  statItem: { alignItems: "center", gap: 6 },
  statLabel: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  seeAll: { fontSize: 14, color: "#111827", fontWeight: "600" },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyTxt: { color: "#9ca3af", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    flex: 1,
  },
  imgWrap: { position: "relative", height: 140, backgroundColor: "#f3f4f6" },
  cardImg: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 10 },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
    lineHeight: 18,
  },
  cardBrand: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  price: { fontSize: 15, fontWeight: "800", color: "#111827" },
  mrp: { fontSize: 12, color: "#9ca3af", textDecorationLine: "line-through" },
  outOfStock: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  addBtnDisabled: { backgroundColor: "#9ca3af" },
  addBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  quickLinks: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickItem: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    elevation: 1,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
});
