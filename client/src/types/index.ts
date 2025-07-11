export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'admin' | 'manager' | 'logist' | 'client';
  isActive: boolean;
  telegramUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Logist {
  id: number;
  userId: string;
  location: string;
  address: string;
  supportsLockers: boolean;
  supportsOffices: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Package {
  id: number;
  uniqueNumber: string;
  clientId: string;
  logistId: number;
  telegramUsername: string;
  recipientName: string;
  deliveryType: 'locker' | 'address';
  lockerAddress?: string;
  lockerCode?: string;
  courierService: string;
  trackingNumber: string;
  estimatedDeliveryDate?: string;
  itemName: string;
  shopName: string;
  comments?: string;
  status: PackageStatus;
  adminComments?: string;
  paymentAmount?: number;
  paymentDetails?: string;
  createdAt: string;
  updatedAt: string;
  client: User;
  logist: Logist;
}

export type PackageStatus = 
  // Общие статусы для всех
  | 'created' // Создана
  | 'sent_to_logist' // Передана логисту
  | 'received_by_logist' // Получена логистом
  | 'logist_confirmed' // Логист подтвердил получение
  | 'info_sent_to_client' // Передана информация клиенту
  | 'confirmed_by_client' // Подтверждена клиентом
  | 'awaiting_payment' // Ожидает оплаты
  | 'awaiting_processing' // Ожидает обработки
  | 'awaiting_shipping' // Ожидает отправки
  | 'shipped' // Отправлена
  | 'paid'; // Оплачена

export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'package_status' | 'system' | 'payment';
  isRead: boolean;
  packageId?: number;
  createdAt: string;
}

export interface Message {
  id: number;
  packageId: number;
  senderId: string;
  message: string;
  createdAt: string;
  sender: User;
}

export interface PackageFile {
  id: number;
  packageId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  fileType: string;
  createdAt: string;
}
