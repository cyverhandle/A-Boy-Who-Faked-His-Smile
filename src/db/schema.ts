import { integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const bookOrders = pgTable("book_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  receipt: varchar("receipt", { length: 40 }).notNull().unique(),
  bookTitle: text("book_title").notNull(),
  quantity: integer("quantity").notNull().default(1),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: varchar("shipping_city", { length: 120 }).notNull(),
  shippingState: varchar("shipping_state", { length: 120 }).notNull(),
  shippingPincode: varchar("shipping_pincode", { length: 20 }).notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 64 }).unique(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 64 }).unique(),
  razorpaySignature: text("razorpay_signature"),
  razorpayPaymentStatus: varchar("razorpay_payment_status", { length: 40 }),
  status: varchar("status", { length: 32 }).notNull().default("initializing"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BookOrder = typeof bookOrders.$inferSelect;
export type NewBookOrder = typeof bookOrders.$inferInsert;
