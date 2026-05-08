import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { addToWishlist, removeFromWishlist } from "../redux/wishlistSlice";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

const formatPrice = (p) => {
  if (!p && p !== 0) return "M0";
  return `M${Number(p).toLocaleString("en-LS", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function ProductViewScreen({ navigation, route }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const dispatch = useDispatch();
  const user = useSelector((s) => s.user);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => i.id === productId);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (snap.exists()) {
          const d = snap.data();
          const p = {
            id: snap.id,
            ...d,
            price: parseFloat(d.price) || 0,
            mrp: d.mrp ? parseFloat(d.mrp) : null,
            stock: parseInt(d.stock, 10) || 0,
          };
          setProduct(p);
          navigation.setOptions({ title: p.name || "Product" });

          // Fetch related products (same category)
          if (p.category) {
            const allSnap = await getDocs(collection(db, "products"));
            const rel = allSnap.docs
              .filter(
                (dd) =>
                  dd.id !== productId && dd.data().category === p.category,
              )
              .slice(0, 4)
              .map((dd) => ({
                id: dd.id,
                ...dd.data(),
                price: parseFloat(dd.data().price) || 0,
              }));
            setRelated(rel);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const handleAddToCart = () => {
    if (!user.uid) {
      Toast.show({ type: "info", text1: "Sign in to add items to cart" });
      navigation.navigate("SignIn");
      return;
    }
    if (!product || product.stock <= 0) {
      Toast.show({ type: "error", text1: "Out of stock" });
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity }));
    Toast.show({
      type: "success",
      text1: `Added ${quantity} item(s) to cart!`,
    });
  };

  const handleWishlist = async () => {
    if (!user.uid) {
      Toast.show({ type: "info", text1: "Sign in to save to wishlist" });
      return;
    }
    if (isWishlisted) {
      dispatch(removeFromWishlist(productId));
      // Sync removal to Firestore
      try {
        await deleteDoc(doc(db, "users", user.uid, "wishlist", productId));
      } catch {}
      Toast.show({ type: "info", text1: "Removed from wishlist" });
    } else {
      const wishlistItem = {
        id: productId,
        name: product.name,
        price: product.price,
        originalPrice: product.mrp || null,
        image: product.images?.[0] || product.image || null,
        addedAt: new Date().toISOString(),
        stock: product.stock,
        type: product.type || product.category || "",
      };
      dispatch(addToWishlist(wishlistItem));
      // Sync to Firestore
      try {
        await setDoc(
          doc(db, "users", user.uid, "wishlist", productId),
          wishlistItem,
        );
      } catch {}
      Toast.show({ type: "success", text1: "Saved to wishlist" });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorWrap}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorTxt}>Product not found</Text>
      </View>
    );
  }

  const images =
    product.images?.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : product.discount || 0;
  const inStock = product.stock > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Image carousel */}
      <View style={styles.imageBox}>
        {images.length > 0 ? (
          <Image
            source={{ uri: images[imageIndex] }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={64} color="#d1d5db" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discBadge}>
            <Text style={styles.discTxt}>{discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishBtn} onPress={handleWishlist}>
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={22}
            color={isWishlisted ? "#dc2626" : "#374151"}
          />
        </TouchableOpacity>
      </View>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {images.map((img, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setImageIndex(i)}
              style={[styles.thumb, i === imageIndex && styles.thumbActive]}
            >
              <Image
                source={{ uri: img }}
                style={styles.thumbImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.body}>
        {/* Category / brand */}
        <View style={styles.metaRow}>
          {product.category && (
            <Text style={styles.catTxt}>{product.category}</Text>
          )}
          {product.brand && (
            <Text style={styles.brandTxt}>{product.brand}</Text>
          )}
        </View>

        <Text style={styles.productName}>{product.name}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.mrp && product.mrp > product.price && (
            <>
              <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveTxt}>
                  Save {formatPrice(product.mrp - product.price)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Stock status */}
        <View style={[styles.stockRow, !inStock && styles.stockRowOos]}>
          <View style={[styles.stockDot, !inStock && styles.stockDotOos]} />
          <Text style={[styles.stockTxt, !inStock && styles.stockTxtOos]}>
            {inStock
              ? `${product.stock} unit${product.stock !== 1 ? "s" : ""} in stock`
              : "Out of stock"}
          </Text>
        </View>

        {/* SKU */}
        {product.sku && <Text style={styles.sku}>SKU: {product.sku}</Text>}

        {/* Description */}
        {product.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        ) : null}

        {/* Features */}
        {product.features?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {product.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#111827" />
                <Text style={styles.featureTxt}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Specifications */}
        {product.specifications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {product.specifications.map((s, i) => (
              <View
                key={i}
                style={[styles.specRow, i % 2 === 0 && styles.specRowEven]}
              >
                <Text style={styles.specKey}>{s.key}</Text>
                <Text style={styles.specVal}>{s.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quantity selector */}
        {inStock && (
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={18} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
              >
                <Ionicons name="add" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Products</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {related.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.relCard}
                  onPress={() =>
                    navigation.push("ProductView", { productId: r.id })
                  }
                >
                  {r.images?.[0] || r.image ? (
                    <Image
                      source={{ uri: r.images?.[0] || r.image }}
                      style={styles.relImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.relImgEmpty}>
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color="#d1d5db"
                      />
                    </View>
                  )}
                  <Text style={styles.relName} numberOfLines={2}>
                    {r.name}
                  </Text>
                  <Text style={styles.relPrice}>{formatPrice(r.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.wishBtnBottom} onPress={handleWishlist}>
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={22}
            color={isWishlisted ? "#dc2626" : "#374151"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addCartBtn, !inStock && styles.addCartBtnDis]}
          onPress={handleAddToCart}
          disabled={!inStock}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addCartTxt}>
            {inStock ? "Add to Cart" : "Out of Stock"}
          </Text>
        </TouchableOpacity>
        {inStock && (
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => {
              handleAddToCart();
              navigation.navigate("Checkout");
            }}
          >
            <Text style={styles.buyTxt}>Buy Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorTxt: { fontSize: 16, color: "#dc2626", fontWeight: "600" },
  imageBox: { backgroundColor: "#fff", height: 280, position: "relative" },
  mainImage: { width: "100%", height: "100%" },
  noImage: { flex: 1, justifyContent: "center", alignItems: "center" },
  discBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  wishBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  thumbs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  thumbActive: { borderColor: "#111827" },
  thumbImg: { width: "100%", height: "100%" },
  body: { padding: 16 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  catTxt: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "600",
  },
  brandTxt: {
    fontSize: 12,
    color: "#374151",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "600",
  },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 26,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  price: { fontSize: 28, fontWeight: "800", color: "#111827" },
  mrp: { fontSize: 18, color: "#9ca3af", textDecorationLine: "line-through" },
  saveBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveTxt: { fontSize: 12, color: "#16a34a", fontWeight: "700" },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  stockRowOos: { backgroundColor: "#fef2f2" },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  stockDotOos: { backgroundColor: "#dc2626" },
  stockTxt: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  stockTxtOos: { color: "#dc2626" },
  sku: { fontSize: 12, color: "#9ca3af", marginBottom: 12 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  description: { fontSize: 14, color: "#374151", lineHeight: 22 },
  featureRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  featureTxt: { fontSize: 14, color: "#374151", flex: 1, lineHeight: 20 },
  specRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12 },
  specRowEven: { backgroundColor: "#f9fafb" },
  specKey: { flex: 1, fontSize: 13, fontWeight: "700", color: "#374151" },
  specVal: { flex: 1, fontSize: 13, color: "#6b7280" },
  qtySection: { marginTop: 20 },
  qtyLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    minWidth: 32,
    textAlign: "center",
  },
  relCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  relImg: { width: "100%", height: 90 },
  relImgEmpty: {
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  relName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    padding: 8,
    paddingBottom: 2,
    lineHeight: 16,
  },
  relPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },
  wishBtnBottom: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  addCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#374151",
    borderRadius: 12,
    paddingVertical: 13,
  },
  addCartBtnDis: { backgroundColor: "#9ca3af" },
  addCartTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  buyBtn: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  buyTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
