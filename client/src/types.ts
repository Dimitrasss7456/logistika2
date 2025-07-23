// Package status types according to ТЗ specification
export type PackageStatus = 
  // Client statuses
  | "created_client" // Создана (клиент)
  | "received_by_logist_client" // Получена логистом (клиент)
  | "awaiting_processing_client" // Ожидает обработки (клиент)
  | "awaiting_payment_client" // Ожидает оплаты (клиент)
  | "awaiting_shipping_client" // Ожидает отправки (клиент)
  | "shipped_client" // Отправлена (клиент)
  
  // Logist statuses
  | "received_info_logist" // Получена информация о посылке (логист)
  | "package_received_logist" // Посылка получена (логист)
  | "awaiting_shipping_logist" // Ожидает отправки (логист)
  | "shipped_logist" // Отправлена (логист)
  | "paid_logist" // Оплачена (логист)
  
  // Manager/Admin statuses
  | "created_manager" // Создана (менеджер)
  | "sent_to_logist_manager" // Передана логисту (менеджер)
  | "logist_confirmed_manager" // Логист подтвердил получение (менеджер)
  | "info_sent_to_client_manager" // Передана информация клиенту (менеджер)
  | "confirmed_by_client_manager" // Подтверждена клиентом (менеджер)
  | "awaiting_payment_manager" // Ожидает оплаты (менеджер)
  | "awaiting_processing_manager" // Ожидает обработки (менеджер)
  | "awaiting_shipping_manager" // Ожидает отправки (менеджер)
  | "shipped_by_logist_manager" // Отправлена логистом (менеджер)
  | "paid_manager"; // Оплачена (менеджер)

export type UserRole = "admin" | "manager" | "logist" | "client";

export type NotificationType = "system" | "package_status" | "password_reset";

export interface User {
  id: string;
  email: string | null;
  login: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: UserRole;
  isActive: boolean;
  telegramUsername: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Logist {
  id: number;
  userId: string;
  location: string;
  address: string;
  supportsLockers: boolean;
  supportsOffices: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: number;
  uniqueNumber: string;
  clientId: string;
  logistId: number;
  telegramUsername: string;
  recipientName: string;
  deliveryType: "locker" | "address";
  lockerAddress: string | null;
  lockerCode: string | null;
  courierService: string;
  trackingNumber: string;
  estimatedDeliveryDate: Date | null;
  itemName: string;
  shopName: string;
  comments: string | null;
  status: PackageStatus;
  adminComments: string | null;
  paymentAmount: number | null;
  paymentDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: User;
  logist?: Logist;
}

export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  packageId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  packageId: number;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface PackageFile {
  id: number;
  packageId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}