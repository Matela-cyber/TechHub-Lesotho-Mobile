import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, clearCart } from "../redux/cartSlice";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (p) => {
  if (!p && p !== 0) return "M0.00";
  return `M${Number(p).toLocaleString("en-LS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const VAT_RATE = 0.14;

export default function CartScreen({ navigation }) {
  const cartItems = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.user);
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

  const cartDetails = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  const subtotal = cartDetails.reduce(
    (acc, i) => acc + i.product.price * i.quantity,
    0,
  );
  const tax = subtotal * VAT_RATE;
  const shipping = subtotal > 1000 ? 0 : 100;
  const total = subtotal + tax + shipping;

  const handleRemove = (productId) => dispatch(removeFromCart(productId));
  const handleQty = (productId, qty) => {
    if (qty < 1) {
      dispatch(removeFromCart(productId));
      return;
    }
    dispatch(updateQuantity({ productId, quantity: qty }));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {cartDetails.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Clear Cart", "Remove all items?", [
                { text: "Cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: () => dispatch(clearCart()),
                },
              ])
            }
          >
            <Ionicons name="trash-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>

      {cartDetails.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add some products to get started</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Products")}
          >
            <Text style={styles.shopBtnTxt}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartDetails}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => {
              const img =
                item.product.images?.[0] || item.product.image || null;
              return (
                <View style={styles.cartItem}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ProductView", {
                        productId: item.productId,
                      })
                    }
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={styles.itemImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.itemImg, styles.noImg]}>
                        <Ionicons
                          name="image-outline"
                          size={28}
                          color="#d1d5db"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    {item.product.brand && (
                      <Text style={styles.itemBrand}>{item.product.brand}</Text>
                    )}
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.product.price)}
                    </Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleQty(item.productId, item.quantity - 1)
                        }
                      >
                        <Ionicons name="remove" size={16} color="#111827" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleQty(item.productId, item.quantity + 1)
                        }
                      >
                        <Ionicons name="add" size={16} color="#111827" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item.productId)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#dc2626"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>
                </View>
              );
            }}
            ListFooterComponent={
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>VAT (14%)</Text>
                  <Text style={styles.summaryVal}>{formatPrice(tax)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryVal}>
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </Text>
                </View>
                {shipping > 0 && (
                  <Text style={styles.shippingNote}>
                    Free shipping on orders over M1,000
                  </Text>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>{formatPrice(total)}</Text>
                </View>
              </View>
            }
          />
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => {
                if (!user.uid) {
                  navigation.navigate("SignIn");
                  return;
                }
                navigation.navigate("Checkout");
              }}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#fff" />
              <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
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
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  emptySub: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  shopBtn: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  shopBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    elevation: 1,
    alignItems: "flex-start",
  },
  itemImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  noImg: { justifyContent: "center", alignItems: "center" },
  itemBody: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
    marginBottom: 2,
  },
  itemBrand: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyNum: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    minWidth: 24,
    textAlign: "center",
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  lineTotal: { fontSize: 14, fontWeight: "800", color: "#111827" },
  summary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryVal: { fontSize: 14, color: "#374151", fontWeight: "600" },
  shippingNote: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    marginBottom: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  totalVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  bottomBar: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 16,
  },
  checkoutTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
