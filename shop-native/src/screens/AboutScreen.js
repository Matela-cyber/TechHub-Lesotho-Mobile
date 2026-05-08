import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const TEAM = [
  {
    name: "Teboho Matela",
    role: "Founder & CEO",
    description:
      "Tech enthusiast dedicated to making premium technology accessible in Lesotho.",
  },
  {
    name: "Support Team",
    role: "Customer Care",
    description: "Always here to help you with any questions or concerns.",
  },
];

const VALUES = [
  {
    icon: "shield-checkmark-outline",
    title: "Genuine Products",
    desc: "Every product we sell is 100% authentic and sourced from verified suppliers.",
  },
  {
    icon: "rocket-outline",
    title: "Fast Delivery",
    desc: "We deliver to your door across Lesotho, quickly and reliably.",
  },
  {
    icon: "people-outline",
    title: "Customer First",
    desc: "Your satisfaction is our top priority. We're here for you every step of the way.",
  },
  {
    icon: "medal-outline",
    title: "Quality Assured",
    desc: "Products are quality-checked before dispatch. Shop with confidence.",
  },
];

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Ionicons name="storefront-outline" size={48} color="#fff" />
          <Text style={styles.heroTitle}>TechHub Lesotho</Text>
          <Text style={styles.heroSub}>Your Trusted Tech Partner</Text>
        </View>

        <View style={styles.body}>
          {/* Mission */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.para}>
              TechHub Lesotho is committed to making the latest technology
              products accessible and affordable to everyone in Lesotho and the
              region. We believe that technology is a right, not a privilege —
              and we work every day to bridge the digital gap.
            </Text>
          </View>

          {/* Values */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Values</Text>
            <View style={styles.values}>
              {VALUES.map((v) => (
                <View key={v.title} style={styles.valueCard}>
                  <View style={styles.valueIconWrap}>
                    <Ionicons name={v.icon} size={24} color="#111827" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.valueTitle}>{v.title}</Text>
                    <Text style={styles.valueDesc}>{v.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Team */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meet the Team</Text>
            {TEAM.map((t) => (
              <View key={t.name} style={styles.teamCard}>
                <View style={styles.teamAvatar}>
                  <Ionicons name="person" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{t.name}</Text>
                  <Text style={styles.teamRole}>{t.role}</Text>
                  <Text style={styles.teamDesc}>{t.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Have questions?</Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate("Contact")}
            >
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.ctaBtnTxt}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#111827",
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 14, color: "#9ca3af" },
  body: { padding: 20 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  para: { fontSize: 14, color: "#374151", lineHeight: 22 },
  values: { gap: 12 },
  valueCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    alignItems: "flex-start",
  },
  valueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  valueDesc: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  teamCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  teamAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  teamName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  teamRole: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  teamDesc: { fontSize: 13, color: "#374151", lineHeight: 18 },
  cta: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  ctaTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ctaBtnTxt: { color: "#111827", fontWeight: "700", fontSize: 14 },
});
