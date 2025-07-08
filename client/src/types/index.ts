export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'admin' | 'logist' | 'client';
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
  | 'created_client'
  | 'created_admin'
  | 'sent_to_logist'
  | 'received_info'
  | 'package_received'
  | 'logist_confirmed'
  | 'info_sent_to_client'
  | 'client_received'
  | 'awaiting_processing_client'
  | 'confirmed_by_client'
  | 'awaiting_payment_admin'
  | 'awaiting_payment_client'
  | 'awaiting_processing_admin'
  | 'awaiting_shipping_admin'
  | 'awaiting_shipping_client'
  | 'awaiting_shipping_logist'
  | 'sent_logist'
  | 'sent_by_logist'
  | 'sent_client'
  | 'paid_logist'
  | 'paid_admin';

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
