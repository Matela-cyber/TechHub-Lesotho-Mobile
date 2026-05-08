import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  clearCart,
  applyCoupon,
  removeCoupon,
  removePurchasedFromCart,
} from "../redux/cartSlice";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { processNewOrder } from "../utils/orderService";
import { SafeAreaView } from "react-native-safe-area-context";

const VAT_RATE = 0.14;
const formatPrice = (p) =>
  `M${Number(p || 0).toLocaleString("en-LS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STEPS = ["Shipping", "Payment", "Review"];

const COUNTRY_CODES = {
  Lesotho: "+266",
  "South Africa": "+27",
  India: "+91",
  "United States": "+1",
  "United Kingdom": "+44",
};

export default function CheckoutScreen({ navigation }) {
  const cartItems = useSelector((s) => s.cart.items);
  const appliedCoupon = useSelector((s) => s.cart.coupon);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();

  const [step, setStep] = useState(0);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [placing, setPlacing] = React.useState(false);
  const [orderDone, setOrderDone] = React.useState(null);

  // Shipping
  const [address, setAddress] = React.useState({
    houseNo: "",
    line1: "",
    city: "",
    state: "",
    country: "Lesotho",
    pin: "",
  });
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+266");
  const [shippingMethod, setShippingMethod] = React.useState("standard");

  // Payment
  const [paymentMethod, setPaymentMethod] = React.useState("Cash on Delivery");

  // Coupon
  const [couponInput, setCouponInput] = React.useState("");
  const [couponLoading, setCouponLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            price: parseFloat(d.data().price) || 0,
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

  // Load user's saved address, name, phone from Firestore on mount — matches web
  React.useEffect(() => {
    if (!user.uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.name) setName(d.name);
          if (d.phone) {
            let ph = d.phone;
            let cc = "+266";
            for (const [, code] of Object.entries(COUNTRY_CODES)) {
              if (ph.startsWith(code)) {
                cc = code;
                ph = ph.substring(code.length);
                break;
              }
            }
            setCountryCode(cc);
            setPhone(ph);
          }
          if (d.address) {
            setAddress({
              houseNo: "",
              line1: "",
              city: "",
              state: "",
              country: "Lesotho",
              pin: "",
              ...d.address,
            });
          }
        }
      } catch {}
    })();
  }, [user.uid]);

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

  // Shipping cost — matches web logic exactly
  let shippingCost = 0;
  if (address.country === "Lesotho" || address.country === "India") {
    if (shippingMethod === "express") {
      shippingCost = 150;
    } else if (subtotal <= 1000) {
      shippingCost = 100;
    }
  } else if (address.country) {
    shippingCost = shippingMethod === "express" ? 600 : 500;
  }

  // Import duty for US orders
  const importDuty = address.country === "United States" ? subtotal * 0.69 : 0;

  // Discount — use pre-calculated discountAmount from Redux (matches web)
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const tax = subtotal * VAT_RATE;
  const total = subtotal + tax + shippingCost - discountAmount + importDuty;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const normalizedCode = couponInput.trim().toUpperCase();
      const q = query(
        collection(db, "coupons"),
        where("code", "==", normalizedCode),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        Toast.show({ type: "error", text1: "Invalid coupon code" });
        return;
      }
      const couponDoc = snap.docs[0];
      const c = { id: couponDoc.id, ...couponDoc.data() };
      if (!c.isActive) {
        Toast.show({ type: "error", text1: "This coupon is no longer active" });
        return;
      }
      const now = new Date();
      if (c.endDate && new Date(c.endDate) < now) {
        Toast.show({ type: "error", text1: "Coupon has expired" });
        return;
      }
      if (c.startDate && new Date(c.startDate) > now) {
        Toast.show({
          type: "error",
          text1: `Coupon valid from ${new Date(c.startDate).toLocaleDateString()}`,
        });
        return;
      }
      if (c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) {
        Toast.show({ type: "error", text1: "Coupon usage limit reached" });
        return;
      }
      if (subtotal < (c.minOrderAmount || c.minPurchaseAmount || 0)) {
        Toast.show({
          type: "error",
          text1: `Minimum purchase M${c.minOrderAmount || c.minPurchaseAmount} required`,
        });
        return;
      }
      // Calculate discount amount — store in Redux as discountAmount (matches web)
      let discAmt = 0;
      if (c.discountType === "percentage") {
        discAmt = (subtotal * (c.discountValue || 0)) / 100;
        if (c.maxDiscountAmount > 0 && discAmt > c.maxDiscountAmount)
          discAmt = c.maxDiscountAmount;
      } else {
        discAmt = c.discountValue || 0;
        if (discAmt > subtotal) discAmt = subtotal;
      }
      dispatch(
        applyCoupon({
          code: c.code,
          couponId: couponDoc.id,
          discountAmount: discAmt,
          discountType: c.discountType,
          discountValue: c.discountValue,
        }),
      );
      Toast.show({
        type: "success",
        text1: `Coupon applied! -${c.discountType === "percentage" ? c.discountValue + "%" : "M" + c.discountValue}`,
      });
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Failed to validate coupon" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === 0) {
      if (!name.trim()) {
        Toast.show({ type: "error", text1: "Please enter your full name" });
        return;
      }
      if (!phone.trim()) {
        Toast.show({ type: "error", text1: "Please enter your phone number" });
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim()) {
      Toast.show({
        type: "error",
        text1: "Please provide your name and phone number",
      });
      return;
    }
    setPlacing(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        userName: name || user.name || user.displayName || "",
        userPhone: fullPhone,
        orderDate: new Date().toISOString(),
        items: cartDetails.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images?.[0] || i.product.image || null,
        })),
        shipping: {
          address: { ...address },
          method:
            shippingMethod === "express"
              ? "Express Shipping"
              : "Standard Shipping",
          cost: shippingCost,
          estimatedDelivery: shippingMethod === "express" ? "2 days" : "7 days",
        },
        payment: {
          method: paymentMethod,
          details: { note: "Awaiting confirmation" },
        },
        subtotal,
        tax,
        importDuty,
        discount: discountAmount,
        totalAmount: total,
        shippingAddress: {
          name,
          street: `${address.houseNo ? address.houseNo + ", " : ""}${address.line1}`,
          city: address.city,
          state: address.state,
          zip: address.pin,
          country: address.country,
        },
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              discountAmount: appliedCoupon.discountAmount,
              discountType: appliedCoupon.discountType,
              discountValue: appliedCoupon.discountValue,
            }
          : null,
      };

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name || user.displayName || "",
        name: name || user.name || "",
        phone: fullPhone,
      };

      const result = await processNewOrder(orderData, userData);

      // Save address and profile back to Firestore — matches web behaviour
      try {
        await updateDoc(doc(db, "users", user.uid), {
          address: { ...address },
          name: name.trim(),
          phone: fullPhone,
        });
      } catch {}

      dispatch(removePurchasedFromCart(cartDetails.map((i) => i.productId)));
      if (appliedCoupon) dispatch(removeCoupon());
      dispatch(clearCart());
      navigation.replace("OrderSummary", { orderId: result.orderId, total });
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: e.message || "Failed to place order. Try again.",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );

  if (cartDetails.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          padding: 32,
        }}
      >
        <Ionicons name="cart-outline" size={64} color="#d1d5db" />
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
          Your cart is empty
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate("Products")}
        >
          <Text style={styles.btnTxt}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Step indicator */}
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View
                  style={[styles.stepDot, i <= step && styles.stepDotActive]}
                >
                  <Text
                    style={[styles.stepNum, i <= step && styles.stepNumActive]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    i === step && styles.stepLabelActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[styles.stepLine, i < step && styles.stepLineActive]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 0: Shipping */}
          {step === 0 && (
            <View>
              <Text style={styles.sectionTitle}>Shipping Details</Text>
              {[
                {
                  label: "Full Name *",
                  value: name,
                  onChange: setName,
                  placeholder: "Your full name",
                },
              ].map((f) => (
                <View key={f.label} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.codeBtn}
                    onPress={() => {
                      Alert.alert(
                        "Country Code",
                        "Select code",
                        Object.entries(COUNTRY_CODES).map(([c, v]) => ({
                          text: `${c} (${v})`,
                          onPress: () => setCountryCode(v),
                        })),
                      );
                    }}
                  >
                    <Text style={styles.codeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={14} color="#6b7280" />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              {[
                {
                  label: "House / Unit No.",
                  key: "houseNo",
                  placeholder: "e.g. Apt 4B",
                },
                {
                  label: "Street Address *",
                  key: "line1",
                  placeholder: "Street address",
                },
                { label: "City *", key: "city", placeholder: "City" },
                {
                  label: "District / Region",
                  key: "state",
                  placeholder: "District",
                },
                { label: "Country", key: "country", placeholder: "Country" },
                {
                  label: "Postal Code",
                  key: "pin",
                  placeholder: "Postal code",
                },
              ].map((f) => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={address[f.key]}
                    onChangeText={(v) =>
                      setAddress((p) => ({ ...p, [f.key]: v }))
                    }
                    placeholder={f.placeholder}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ))}
              {/* Shipping method — matches web */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Shipping Method
              </Text>
              {[
                {
                  key: "standard",
                  label: "Standard Shipping",
                  desc:
                    address.country === "Lesotho" || address.country === "India"
                      ? subtotal > 1000
                        ? "Free (order over M1000)"
                        : "M100 • Est. 7 days"
                      : "M500 • Est. 14 days",
                },
                {
                  key: "express",
                  label: "Express Shipping",
                  desc:
                    address.country === "Lesotho" || address.country === "India"
                      ? "M150 • Est. 2 days"
                      : "M600 • Est. 5 days",
                },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.payOption,
                    shippingMethod === m.key && styles.payOptionActive,
                  ]}
                  onPress={() => setShippingMethod(m.key)}
                >
                  <Ionicons
                    name={
                      shippingMethod === m.key
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={shippingMethod === m.key ? "#111827" : "#9ca3af"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.payLabel,
                        shippingMethod === m.key && styles.payLabelActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {m.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              {["Cash on Delivery", "Bank Transfer", "M-Pesa", "EFT"].map(
                (method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.payOption,
                      paymentMethod === method && styles.payOptionActive,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Ionicons
                      name={
                        paymentMethod === method
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={paymentMethod === method ? "#111827" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.payLabel,
                        paymentMethod === method && styles.payLabelActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
              {paymentMethod === "Bank Transfer" && (
                <View style={styles.bankInfo}>
                  <Text style={styles.bankTitle}>Bank Transfer Details</Text>
                  <Text style={styles.bankDetail}>
                    Bank: Standard Lesotho Bank
                  </Text>
                  <Text style={styles.bankDetail}>
                    Account Name: TechHub Lesotho
                  </Text>
                  <Text style={styles.bankDetail}>
                    Account Number: 0123456789
                  </Text>
                  <Text style={styles.bankDetail}>Branch Code: 001</Text>
                  <Text style={styles.bankNote}>
                    Please use your order number as reference. Send proof of
                    payment to info@techhub.co.ls
                  </Text>
                </View>
              )}
              {/* Coupon */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Coupon Code
              </Text>
              {appliedCoupon ? (
                <View style={styles.couponApplied}>
                  <View>
                    <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                    <Text style={styles.couponSave}>
                      You save: {formatPrice(appliedCoupon.discountAmount || 0)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => dispatch(removeCoupon())}>
                    <Ionicons name="close-circle" size={22} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={couponInput}
                    onChangeText={setCouponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.couponBtn}
                    onPress={handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.couponBtnTxt}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Order Review</Text>
              {cartDetails.map((item) => (
                <View key={item.productId} style={styles.reviewItem}>
                  <Text style={styles.reviewName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.reviewQty}>×{item.quantity}</Text>
                  <Text style={styles.reviewPrice}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>
                </View>
              ))}
              <View style={styles.reviewSummary}>
                {[
                  { label: "Subtotal", value: formatPrice(subtotal) },
                  discountAmount > 0 && {
                    label: "Discount",
                    value: `-${formatPrice(discountAmount)}`,
                  },
                  { label: "VAT (14%)", value: formatPrice(tax) },
                  {
                    label: "Shipping",
                    value:
                      shippingCost === 0 ? "Free" : formatPrice(shippingCost),
                  },
                  importDuty > 0 && {
                    label: "Import Duty",
                    value: formatPrice(importDuty),
                  },
                ]
                  .filter(Boolean)
                  .map((row) => (
                    <View key={row.label} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{row.label}</Text>
                      <Text style={styles.summaryVal}>{row.value}</Text>
                    </View>
                  ))}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>{formatPrice(total)}</Text>
                </View>
              </View>
              <View style={styles.addressReview}>
                <Text style={styles.reviewSubTitle}>Delivery to:</Text>
                <Text style={styles.reviewAddr}>{name}</Text>
                <Text style={styles.reviewAddr}>
                  {address.houseNo} {address.line1}, {address.city}
                </Text>
                <Text style={styles.reviewAddr}>
                  {address.country} {address.pin}
                </Text>
                <Text style={styles.reviewAddr}>
                  {countryCode}
                  {phone}
                </Text>
              </View>
              <View style={styles.payReview}>
                <Text style={styles.reviewSubTitle}>Payment:</Text>
                <Text style={styles.reviewAddr}>{paymentMethod}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navBar}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(step - 1)}
            >
              <Ionicons name="arrow-back" size={18} color="#111827" />
              <Text style={styles.backTxt}>Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 0 && { flex: 1 }]}
              onPress={handleContinue}
            >
              <Text style={styles.nextTxt}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.placeBtn}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.placeTxt}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  steps: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: { backgroundColor: "#111827" },
  stepNum: { fontSize: 13, fontWeight: "700", color: "#9ca3af" },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  stepLabelActive: { color: "#111827" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 14,
  },
  stepLineActive: { backgroundColor: "#111827" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 5 },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  phoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  codeText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 10,
  },
  payOptionActive: { borderColor: "#111827", backgroundColor: "#f9fafb" },
  payLabel: { fontSize: 15, color: "#6b7280", fontWeight: "600" },
  payLabelActive: { color: "#111827" },
  bankInfo: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0369a1",
    marginBottom: 8,
  },
  bankDetail: { fontSize: 13, color: "#374151", marginBottom: 3 },
  bankNote: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  couponRow: { flexDirection: "row", gap: 10 },
  couponBtn: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  couponBtnTxt: { color: "#fff", fontWeight: "700" },
  couponApplied: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  couponCode: { fontSize: 14, fontWeight: "800", color: "#16a34a" },
  couponSave: { fontSize: 12, color: "#16a34a" },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  reviewName: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "600" },
  reviewQty: { fontSize: 13, color: "#6b7280", marginHorizontal: 8 },
  reviewPrice: { fontSize: 14, fontWeight: "700", color: "#111827" },
  reviewSummary: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryVal: { fontSize: 14, color: "#374151", fontWeight: "600" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  totalVal: { fontSize: 17, fontWeight: "800", color: "#111827" },
  addressReview: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    elevation: 1,
  },
  payReview: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    elevation: 1,
  },
  reviewSubTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  reviewAddr: { fontSize: 13, color: "#374151", marginBottom: 2 },
  navBar: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  backTxt: { fontSize: 15, fontWeight: "700", color: "#111827" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  placeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
  },
  placeTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btn: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
