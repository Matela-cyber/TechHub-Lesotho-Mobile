import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard,
  multiline,
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboard || "default"}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      autoCapitalize="none"
    />
  </View>
);

export default function AddProductScreen({ navigation, route }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    mrp: "",
    stock: "",
    category: "",
    brand: "",
    sku: "",
    description: "",
    discount: "",
    showOnHome: false,
  });
  const [images, setImages] = useState([""]);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const setImage = (index, val) => {
    const updated = [...images];
    updated[index] = val;
    setImages(updated);
  };

  const addImageField = () => {
    if (images.length < 5) setImages([...images, ""]);
  };

  const removeImageField = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      Toast.show({
        type: "error",
        text1: "Name, price and stock are required",
      });
      return;
    }
    const price = parseFloat(form.price);
    const mrp = parseFloat(form.mrp) || 0;
    if (mrp > 0 && mrp <= price) {
      Toast.show({
        type: "error",
        text1: "Original price must be greater than selling price",
      });
      return;
    }
    setSaving(true);
    try {
      const validImages = images.map((u) => u.trim()).filter(Boolean);
      await addDoc(collection(db, "products"), {
        name: form.name.trim(),
        price,
        mrp: mrp || null,
        stock: parseInt(form.stock) || 0,
        category: form.category.trim(),
        brand: form.brand.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        images: validImages,
        discount: parseFloat(form.discount) || 0,
        showOnHome: form.showOnHome,
        createdAt: serverTimestamp(),
      });
      Toast.show({ type: "success", text1: "Product added!" });
      route.params?.onAdded?.();
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Failed to add product" });
    } finally {
      setSaving(false);
    }
  };

  const previewImage = images.find((u) => u.trim());

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {previewImage ? (
          <Image
            source={{ uri: previewImage }}
            style={styles.preview}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#d1d5db" />
            <Text style={styles.previewText}>No image yet</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images (URLs)</Text>
          {images.map((url, i) => (
            <View key={i} style={styles.imageRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={url}
                onChangeText={(v) => setImage(i, v)}
                placeholder={`Image URL ${i + 1}`}
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {images.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeImageField(i)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={addImageField}
            >
              <Ionicons name="add-circle-outline" size={18} color="#1d4ed8" />
              <Text style={styles.addImageText}>Add another image URL</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <Field
            label="Product Name *"
            value={form.name}
            onChangeText={(v) => set("name", v)}
            placeholder="e.g. HP ProBook Laptop"
          />
          <Field
            label="Category"
            value={form.category}
            onChangeText={(v) => set("category", v)}
            placeholder="e.g. Laptops"
          />
          <Field
            label="Brand"
            value={form.brand}
            onChangeText={(v) => set("brand", v)}
            placeholder="e.g. HP"
          />
          <Field
            label="SKU / Model Number"
            value={form.sku}
            onChangeText={(v) => set("sku", v)}
            placeholder="e.g. HP-PB450G8"
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => set("description", v)}
            placeholder="Describe the product..."
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Stock</Text>
          <Field
            label="Selling Price (M) *"
            value={form.price}
            onChangeText={(v) => set("price", v)}
            placeholder="e.g. 5999"
            keyboard="decimal-pad"
          />
          <Field
            label="Original Price / MRP (M)"
            value={form.mrp}
            onChangeText={(v) => set("mrp", v)}
            placeholder="e.g. 6999 — shows discount badge on shop"
            keyboard="decimal-pad"
          />
          <Field
            label="Stock Quantity *"
            value={form.stock}
            onChangeText={(v) => set("stock", v)}
            placeholder="e.g. 10"
            keyboard="number-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Show on Home Page</Text>
              <Text style={styles.switchSub}>Featured in the home screen</Text>
            </View>
            <Switch
              value={form.showOnHome}
              onValueChange={(v) => set("showOnHome", v)}
              trackColor={{ true: "#1d4ed8" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.btnText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  content: { padding: 16 },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  previewPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  previewText: { color: "#9ca3af", marginTop: 8, fontSize: 13 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 5 },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#111827",
  },
  multiline: { height: 100, paddingTop: 10 },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  removeBtn: { padding: 4 },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  addImageText: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  switchSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  btn: {
    backgroundColor: "#1d4ed8",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: { backgroundColor: "#93c5fd" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
