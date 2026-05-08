import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { removeFromWishlist, clearWishlist } from "../redux/wishlistSlice";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (p) =>
  `M${Number(p || 0).toLocaleString("en-LS", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function WishlistScreen({ navigation }) {
  const user = useSelector((s) => s.user);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            price: parseFloat(d.data().price) || 0,
            mrp: d.data().mrp ? parseFloat(d.data().mrp) : null,
            stock: parseInt(d.data().stock, 10) || 0,
          })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user.uid) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#f9fafb" }}
        edges={["top"]}
      >
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sign in to view your wishlist</Text>
          <Text style={styles.emptySub}>
            Save products you love and access them anytime.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.signInTxt}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Merge wishlist items with current product data
  const enriched = wishlistItems.map((wItem) => {
    const product = products.find((p) => p.id === wItem.id);
    return product ? { ...wItem, ...product } : wItem;
  });

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        {enriched.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              // Also clear from Firestore
              if (user.uid) {
                try {
                  const batch = writeBatch(db);
                  wishlistItems.forEach((item) => {
                    batch.delete(
                      doc(db, "users", user.uid, "wishlist", item.id),
                    );
                  });
                  await batch.commit();
                } catch {}
              }
              dispatch(clearWishlist());
            }}
          >
            <Text style={styles.clearTxt}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {enriched.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Tap the heart on any product to save it here.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Products")}
          >
            <Text style={styles.shopBtnTxt}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={enriched}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const img = item.images?.[0] || item.image || null;
            const inStock = (item.stock || 0) > 0;
            const discount =
              item.mrp && item.mrp > item.price
                ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                : 0;

            return (
              <TouchableOpacity
                style={styles.wishCard}
                onPress={() =>
                  navigation.navigate("ProductView", { productId: item.id })
                }
                activeOpacity={0.95}
              >
                <View style={styles.imgWrap}>
                  {img ? (
                    <Image
                      source={{ uri: img }}
                      style={styles.productImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.productImg, styles.noImg]}>
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#d1d5db"
                      />
                    </View>
                  )}
                  {discount > 0 && (
                    <View style={styles.discBadge}>
                      <Text style={styles.discTxt}>{discount}% OFF</Text>
                    </View>
                  )}
                </View>

                <View style={styles.wishBody}>
                  <Text style={styles.wishName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.brand && (
                    <Text style={styles.wishBrand}>{item.brand}</Text>
                  )}
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(item.price)}</Text>
                    {item.mrp && item.mrp > item.price && (
                      <Text style={styles.mrp}>{formatPrice(item.mrp)}</Text>
                    )}
                  </View>
                  <Text
                    style={[styles.stockTxt, !inStock && styles.stockTxtOos]}
                  >
                    {inStock ? "In Stock" : "Out of Stock"}
                  </Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.addBtn, !inStock && styles.addBtnDis]}
                      onPress={() => {
                        if (!inStock) return;
                        dispatch(
                          addToCart({ productId: item.id, quantity: 1 }),
                        );
                        Toast.show({
                          type: "success",
                          text1: "Added to cart!",
                        });
                      }}
                      disabled={!inStock}
                    >
                      <Ionicons name="cart-outline" size={16} color="#fff" />
                      <Text style={styles.addBtnTxt}>
                        {inStock ? "Add to Cart" : "Out of Stock"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={async () => {
                        // Sync removal to Firestore
                        if (user.uid) {
                          try {
                            await deleteDoc(
                              doc(db, "users", user.uid, "wishlist", item.id),
                            );
                          } catch {}
                        }
                        dispatch(removeFromWishlist(item.id));
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#dc2626"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  clearTxt: { fontSize: 13, color: "#dc2626", fontWeight: "600" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  emptySub: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  shopBtn: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  shopBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  signInBtn: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  signInTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  wishCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 1,
    gap: 12,
    padding: 12,
  },
  imgWrap: { position: "relative" },
  productImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  noImg: { justifyContent: "center", alignItems: "center" },
  discBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#dc2626",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  discTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  wishBody: { flex: 1 },
  wishName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
    marginBottom: 2,
  },
  wishBrand: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  price: { fontSize: 16, fontWeight: "800", color: "#111827" },
  mrp: { fontSize: 12, color: "#9ca3af", textDecorationLine: "line-through" },
  stockTxt: {
    fontSize: 11,
    color: "#22c55e",
    fontWeight: "600",
    marginBottom: 8,
  },
  stockTxtOos: { color: "#dc2626" },
  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 8,
  },
  addBtnDis: { backgroundColor: "#9ca3af" },
  addBtnTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
});
