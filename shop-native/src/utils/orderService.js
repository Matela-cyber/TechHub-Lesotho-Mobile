/**
 * Mobile Order Service — aligned with web orderService.js
 * Uses Firestore transaction for atomic stock decrement + order creation.
 */
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const ORDER_STATUSES = {
  PLACED: "Placed",
  APPROVED: "Approved",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/**
 * Process a new order.
 * @param {Object} orderData  - cart items, shipping, financials etc.
 * @param {Object} userData   - { uid, email, displayName, name, phone }
 * @returns {Promise<Object>} - { success, orderId, userOrderId, paymentId }
 */
export async function processNewOrder(orderData, userData) {
  if (!userData || !userData.uid) {
    throw new Error(
      "User authentication required. Please log in and try again.",
    );
  }
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  const timestamp = new Date().getTime().toString().slice(-6);
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const paymentId = `PAY-${timestamp}-${randomId}`;
  const orderId = `ORDER-${timestamp}-${randomId}`;

  const completeOrderData = {
    ...orderData,
    orderId,
    paymentId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId: userData.uid,
    userName: userData.name || userData.displayName || "Valued Customer",
    userEmail: userData.email || "",
    userPhone: userData.phone || orderData.userPhone || "",
    status: ORDER_STATUSES.PLACED,
    statusHistory: [
      {
        status: ORDER_STATUSES.PLACED,
        timestamp: new Date().toISOString(),
        note: "Order placed successfully",
        updatedBy: "system",
      },
    ],
    adminNotes: "",
    priority: "normal",
    tags: [],
    tracking: {
      code: null,
      carrier:
        orderData.shipping?.address?.country === "Lesotho"
          ? "Local Courier"
          : "DHL",
      url: null,
      estimatedDelivery: null,
      actualDelivery: null,
    },
    financials: {
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      shipping: orderData.shipping?.cost || 0,
      discount: orderData.discount || 0,
      total: orderData.totalAmount || 0,
      currency: "LSL",
    },
  };

  const txResult = await runTransaction(db, async (transaction) => {
    // READS FIRST — validate stock for every item
    const productReads = [];
    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.productId);
      const productDoc = await transaction.get(productRef);
      productReads.push({ ref: productRef, snap: productDoc, item });
    }

    // Soft stock check — log warning but do not block the order
    for (const { snap, item } of productReads) {
      if (!snap.exists()) {
        // Product removed from catalogue — skip stock update for this item
        console.warn(`Product "${item.name}" not found in catalogue.`);
        continue;
      }
      const currentStock = snap.data().stock ?? 0;
      if (currentStock < item.quantity) {
        console.warn(
          `Low stock for "${item.name}": requested ${item.quantity}, available ${currentStock}`,
        );
      }
    }

    // WRITES — global order + user sub-order + stock updates
    const globalOrderRef = doc(collection(db, "orders"));
    transaction.set(globalOrderRef, completeOrderData);

    const userOrderRef = doc(collection(db, "users", userData.uid, "orders"));
    transaction.set(userOrderRef, {
      ...completeOrderData,
      globalOrderId: globalOrderRef.id,
    });

    for (const { ref, snap, item } of productReads) {
      if (!snap.exists()) continue; // product removed — skip
      const newStock = Math.max(0, (snap.data().stock ?? 0) - item.quantity);
      transaction.update(ref, { stock: newStock, lastSold: serverTimestamp() });
    }

    return { globalOrderId: globalOrderRef.id, userOrderId: userOrderRef.id };
  });

  return {
    success: true,
    orderId: txResult.globalOrderId,
    userOrderId: txResult.userOrderId,
    paymentId,
    orderData: completeOrderData,
  };
}
