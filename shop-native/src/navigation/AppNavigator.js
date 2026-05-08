import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { setUser, clearUser } from "../redux/userSlice";
import { setWishlistItems } from "../redux/wishlistSlice";

// Screens
import HomeScreen from "../screens/HomeScreen";
import ProductsScreen from "../screens/ProductsScreen";
import ProductViewScreen from "../screens/ProductViewScreen";
import CartScreen from "../screens/CartScreen";
import WishlistScreen from "../screens/WishlistScreen";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrderSummaryScreen from "../screens/OrderSummaryScreen";
import AboutScreen from "../screens/AboutScreen";
import ContactScreen from "../screens/ContactScreen";
import PasswordResetScreen from "../screens/PasswordResetScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AccountTab({ navigation }) {
  const user = useSelector((s) => s.user);
  if (user.uid) return <ProfileScreen navigation={navigation} />;
  return <SignInScreen navigation={navigation} />;
}

function HomeTabs() {
  const cart = useSelector((s) => s.cart.items);
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: "#fff",
          borderTopColor: "#f3f4f6",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Products: focused ? "grid" : "grid-outline",
            Cart: focused ? "cart" : "cart-outline",
            Wishlist: focused ? "heart" : "heart-outline",
            Account: focused ? "person" : "person-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarBadge: cartCount > 0 ? cartCount : undefined }}
      />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Account" component={AccountTab} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch Firestore profile to get name, phone, address
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const firestoreData = snap.exists() ? snap.data() : {};
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              name: firestoreData.name || firebaseUser.displayName || "",
              phone: firestoreData.phone || "",
            }),
          );
          // Restore wishlist from Firestore (static import, not dynamic)
          const wSnap = await getDocs(
            collection(db, "users", firebaseUser.uid, "wishlist"),
          );
          const wishlistItems = wSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          dispatch(setWishlistItems(wishlistItems));
        } catch {
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              name: firebaseUser.displayName || "",
            }),
          );
        }
      } else {
        dispatch(clearUser());
        dispatch(setWishlistItems([]));
      }
    });
    return unsub;
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={HomeTabs} />
        <Stack.Screen
          name="ProductView"
          component={ProductViewScreen}
          options={{
            headerShown: true,
            title: "Product",
            headerBackTitle: "Back",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            headerShown: true,
            title: "Checkout",
            headerBackTitle: "Back",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="OrderSummary"
          component={OrderSummaryScreen}
          options={{
            headerShown: true,
            title: "Order Confirmed",
            headerBackTitle: "Back",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{
            headerShown: true,
            title: "Sign In",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            headerShown: true,
            title: "Create Account",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="PasswordReset"
          component={PasswordResetScreen}
          options={{
            headerShown: true,
            title: "Reset Password",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: true,
            title: "About Us",
            headerTintColor: "#111827",
          }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            headerShown: true,
            title: "Contact Us",
            headerTintColor: "#111827",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
