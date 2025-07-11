import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "logist", "client"]);

// Package status enum
export const packageStatusEnum = pgEnum("package_status", [
  "created_client",
  "created_admin",
  "sent_to_logist",
  "received_info",
  "package_received",
  "logist_confirmed",
  "info_sent_to_client",
  "client_received",
  "awaiting_processing_client",
  "confirmed_by_client",
  "awaiting_payment_admin",
  "awaiting_payment_client",
  "awaiting_processing_admin",
  "awaiting_shipping_admin",
  "awaiting_shipping_client",
  "awaiting_shipping_logist",
  "sent_logist",
  "sent_by_logist",
  "sent_client",
  "paid_logist",
  "paid_admin"
]);

// Delivery type enum
export const deliveryTypeEnum = pgEnum("delivery_type", ["locker", "address"]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("client").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  telegramUsername: varchar("telegram_username"),
  passwordHash: varchar("password_hash"), // For demo login functionality
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Logists table
export const logists = pgTable("logists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  supportsLockers: boolean("supports_lockers").default(false).notNull(),
  supportsOffices: boolean("supports_offices").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Packages table
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  uniqueNumber: varchar("unique_number").unique().notNull(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  logistId: integer("logist_id").references(() => logists.id).notNull(),

  // Package details
  telegramUsername: varchar("telegram_username").notNull(),
  recipientName: varchar("recipient_name").notNull(),
  deliveryType: deliveryTypeEnum("delivery_type").notNull(),
  lockerAddress: text("locker_address"),
  lockerCode: varchar("locker_code"),
  courierService: varchar("courier_service").notNull(),
  trackingNumber: varchar("tracking_number").notNull(),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  itemName: text("item_name").notNull(),
  shopName: text("shop_name").notNull(),
  comments: text("comments"),

  // Status and workflow
  status: packageStatusEnum("status").default("created_client").notNull(),
  adminComments: text("admin_comments"),
  paymentAmount: integer("payment_amount"), // in kopecks
  paymentDetails: text("payment_details"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Package files table
export const packageFiles = pgTable("package_files", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").references(() => packages.id).notNull(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  fileType: varchar("file_type").notNull(), // 'proof', 'label', 'payment'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // 'package_status', 'system', 'payment'
  isRead: boolean("is_read").default(false).notNull(),
  packageId: integer("package_id").references(() => packages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").references(() => packages.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  packages: many(packages),
  logist: one(logists, {
    fields: [users.id],
    references: [logists.userId],
  }),
  notifications: many(notifications),
  uploadedFiles: many(packageFiles),
  messages: many(messages),
}));

export const logistsRelations = relations(logists, ({ one, many }) => ({
  user: one(users, {
    fields: [logists.userId],
    references: [users.id],
  }),
  packages: many(packages),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  client: one(users, {
    fields: [packages.clientId],
    references: [users.id],
  }),
  logist: one(logists, {
    fields: [packages.logistId],
    references: [logists.id],
  }),
  files: many(packageFiles),
  notifications: many(notifications),
  messages: many(messages),
}));

export const packageFilesRelations = relations(packageFiles, ({ one }) => ({
  package: one(packages, {
    fields: [packageFiles.packageId],
    references: [packages.id],
  }),
  uploader: one(users, {
    fields: [packageFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [notifications.packageId],
    references: [packages.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  package: one(packages, {
    fields: [messages.packageId],
    references: [packages.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertLogistSchema = createInsertSchema(logists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  uniqueNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['package_status', 'system', 'password_reset']).default('system'),
  packageId: z.number().optional(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLogist = z.infer<typeof insertLogistSchema>;
export type Logist = typeof logists.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type PackageFile = typeof packageFiles.$inferSelect;