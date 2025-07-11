import {
  users,
  logists,
  packages,
  notifications,
  messages,
  packageFiles,
  type User,
  type UpsertUser,
  type Logist,
  type InsertLogist,
  type Package,
  type InsertPackage,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  type PackageFile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
  toggleUserAccess(userId: string, isActive: boolean): Promise<void>;

  // Auth operations
  validateCredentials(email: string, password: string): Promise<User | null>;

  // Logist operations
  getLogists(): Promise<(Logist & { user: User })[]>;
  getLogistByUserId(userId: string): Promise<Logist | undefined>;
  createLogist(logist: InsertLogist): Promise<Logist>;
  updateLogist(id: number, logist: Partial<InsertLogist>): Promise<Logist>;

  // Package operations
  getPackages(filters?: {
    clientId?: string;
    logistId?: number;
    status?: string;
    search?: string;
  }): Promise<(Package & { client: User; logist: Logist & { user: User } })[]>;
  getPackageById(id: number): Promise<(Package & { client: User; logist: Logist & { user: User } }) | undefined>;
  createPackage(packageData: InsertPackage): Promise<Package>;
  updatePackageStatus(id: number, status: string, adminComments?: string): Promise<Package>;
  updatePackage(id: number, updates: Partial<InsertPackage>): Promise<Package>;
  reassignPackage(id: number, newLogistId?: number, newClientId?: string): Promise<Package>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Message operations
  getPackageMessages(packageId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // File operations
  getPackageFiles(packageId: number): Promise<PackageFile[]>;
  createPackageFile(file: Omit<PackageFile, 'id' | 'createdAt'>): Promise<PackageFile>;
  deletePackageFile(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values([userData]).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async validateCredentials(emailOrLogin: string, password: string): Promise<User | null> {
    console.log('validateCredentials called with:', emailOrLogin, password);

    // Try to find user by email first
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, emailOrLogin))
      .limit(1);

    // If not found by email, try to find by generated login pattern
    if (user.length === 0) {
      user = await db
        .select()
        .from(users)
        .where(like(users.email, `${emailOrLogin}@generated.local`))
        .limit(1);
    }

    console.log('Found user:', user);

    if (user.length === 0) {
      console.log('No user found');
      return null;
    }

    const foundUser = user[0];

    // Simple password check for demo
    if (foundUser.passwordHash === password && foundUser.isActive) {
      console.log('Password matches and user is active');
      return foundUser;
    }

    console.log('Password does not match or user is inactive');
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role as any));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async toggleUserAccess(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Logist operations
  async getLogists(): Promise<(Logist & { user: User })[]> {
    const logistsList = await db.select().from(logists);
    const result = [];

    for (const logist of logistsList) {
      const [user] = await db.select().from(users).where(eq(users.id, logist.userId));
      result.push({
        ...logist,
        user: user
      });
    }

    return result;
  }

  async getLogistByUserId(userId: string): Promise<Logist | undefined> {
    const [logist] = await db.select().from(logists).where(eq(logists.userId, userId));
    return logist;
  }

  async createLogist(logist: InsertLogist): Promise<Logist> {
    const [newLogist] = await db.insert(logists).values(logist).returning();
    return newLogist;
  }

  async updateLogist(id: number, logist: Partial<InsertLogist>): Promise<Logist> {
    const [updatedLogist] = await db
      .update(logists)
      .set({ ...logist, updatedAt: new Date() })
      .where(eq(logists.id, id))
      .returning();
    return updatedLogist;
  }

  // Package operations
  async getPackages(filters?: {
    clientId?: string;
    logistId?: number;
    status?: string;
    search?: string;
  }): Promise<(Package & { client: User; logist: Logist & { user: User } })[]> {
    const allPackages = await db.select().from(packages).orderBy(desc(packages.createdAt));

    const result = [];
    for (const pkg of allPackages) {
      // Apply filters
      if (filters?.clientId && pkg.clientId !== filters.clientId) continue;
      if (filters?.logistId && pkg.logistId !== filters.logistId) continue;
      if (filters?.status && pkg.status !== filters.status) continue;
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !pkg.uniqueNumber.toLowerCase().includes(searchLower) &&
          !pkg.recipientName.toLowerCase().includes(searchLower) &&
          !pkg.itemName.toLowerCase().includes(searchLower)
        ) continue;
      }

      const [client] = await db.select().from(users).where(eq(users.id, pkg.clientId));
      const [logist] = await db.select().from(logists).where(eq(logists.id, pkg.logistId));

      let logistUser = null;
      if (logist) {
        const [user] = await db.select().from(users).where(eq(users.id, logist.userId));
        logistUser = user;
      }

      result.push({
        ...pkg,
        client: client || null,
        logist: {
          ...logist,
          user: logistUser
        }
      } as any);
    }

    return result;
  }

  async getPackageById(id: number): Promise<(Package & { client: User; logist: Logist & { user: User } }) | undefined> {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, id));
    if (!pkg) return undefined;

    const [client] = await db.select().from(users).where(eq(users.id, pkg.clientId));
    const [logist] = await db.select().from(logists).where(eq(logists.id, pkg.logistId));

    let logistUser = null;
    if (logist) {
      const [user] = await db.select().from(users).where(eq(users.id, logist.userId));
      logistUser = user;
    }

    return {
      ...pkg,
      client: client || null,
      logist: {
        ...logist,
        user: logistUser
      }
    } as any;
  }

  async createPackage(packageData: InsertPackage): Promise<Package> {
    // Generate unique package number
    const uniqueNumber = `PKG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const packageWithNumber = { ...packageData, uniqueNumber, status: 'created_client' as const };

    const [newPackage] = await db.insert(packages).values([packageWithNumber]).returning();

    // Create notifications for admin and logist
    await this.createNotification({
      userId: packageData.logistId.toString(),
      title: 'Новая посылка',
      message: `Вам назначена новая посылка ${uniqueNumber}`,
      type: 'package_status',
      packageId: newPackage.id
    });

    // Create admin notification
    const adminUsers = await this.getUsersByRole('admin');
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title: 'Новая посылка создана',
        message: `Клиент создал новую посылку ${uniqueNumber}`,
        type: 'package_status',
        packageId: newPackage.id
      });
    }

    return newPackage;
  }

  async updatePackageStatus(id: number, status: string, adminComments?: string): Promise<Package> {
    const [updatedPackage] = await db
      .update(packages)
      .set({ 
        status: status as any, 
        adminComments, 
        updatedAt: new Date() 
      })
      .where(eq(packages.id, id))
      .returning();

    // Create notifications based on status change
    await this.createStatusChangeNotifications(updatedPackage, status);

    return updatedPackage;
  }

  // Helper function to create notifications for status changes
  private async createStatusChangeNotifications(pkg: Package, newStatus: string) {
    const statusNotifications = {
      'created_admin': {
        logist: { title: 'Новая посылка', message: `Получена новая посылка ${pkg.uniqueNumber}` },
      },
      'sent_to_logist': {
        logist: { title: 'Посылка передана', message: `Посылка ${pkg.uniqueNumber} передана вам` },
      },
      'package_received': {
        admin: { title: 'Посылка получена', message: `Логист получил посылку ${pkg.uniqueNumber}` },
      },
      'logist_confirmed': {
        client: { title: 'Посылка подтверждена', message: `Логист подтвердил получение посылки ${pkg.uniqueNumber}` },
      },
      'client_received': {
        admin: { title: 'Клиент получил информацию', message: `Клиент получил информацию о посылке ${pkg.uniqueNumber}` },
      },
      'confirmed_by_client': {
        admin: { title: 'Подтверждено клиентом', message: `Клиент подтвердил посылку ${pkg.uniqueNumber}` },
      },
      'awaiting_payment_client': {
        client: { title: 'Ожидает оплаты', message: `Необходима оплата для посылки ${pkg.uniqueNumber}` },
      },
      'awaiting_shipping_logist': {
        logist: { title: 'Готово к отправке', message: `Посылка ${pkg.uniqueNumber} готова к отправке` },
      },
      'sent_client': {
        client: { title: 'Посылка отправлена', message: `Ваша посылка ${pkg.uniqueNumber} отправлена` },
      },
      'paid_logist': {
        logist: { title: 'Оплата получена', message: `Оплата за посылку ${pkg.uniqueNumber} получена` },
      }
    };

    const notification = statusNotifications[newStatus as keyof typeof statusNotifications];
    if (notification) {
      // Send to client
      if ('client' in notification) {
        await this.createNotification({
          userId: pkg.clientId,
          title: notification.client.title,
          message: notification.client.message,
          type: 'package_status',
          packageId: pkg.id
        });
      }

      // Send to logist
      if ('logist' in notification) {
        await this.createNotification({
          userId: pkg.logistId.toString(),
          title: notification.logist.title,
          message: notification.logist.message,
          type: 'package_status',
          packageId: pkg.id
        });
      }

      // Send to admin
      if ('admin' in notification) {
        const adminUsers = await this.getUsersByRole('admin');
        for (const admin of adminUsers) {
          await this.createNotification({
            userId: admin.id,
            title: notification.admin.title,
            message: notification.admin.message,
            type: 'package_status',
            packageId: pkg.id
          });
        }
      }
    }
  }

  async updatePackage(id: number, updates: Partial<InsertPackage>): Promise<Package> {
    const [updatedPackage] = await db
      .update(packages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(packages.id, id))
      .returning();
    return updatedPackage;
  }

  async reassignPackage(id: number, newLogistId?: number, newClientId?: string): Promise<Package> {
    const updateData: any = { updatedAt: new Date() };
    if (newLogistId) updateData.logistId = newLogistId;
    if (newClientId) updateData.clientId = newClientId;

    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, id))
      .returning();
    return updatedPackage;
  }

  async getAllUsers() {
    return await db
      .select()
      .from(users)
      .orderBy(users.createdAt);
  }

  async createUser(userData: any) {
    const [newUser] = await db
      .insert(users)
      .values(userData)
      .returning();
    return newUser;
  }
  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Message operations
  async getPackageMessages(packageId: number): Promise<(Message & { sender: User })[]> {
    const messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.packageId, packageId))
      .orderBy(desc(messages.createdAt));

    const result = [];
    for (const message of messagesList) {
      const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
      result.push({
        ...message,
        sender: sender
      });
    }

    return result;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // File operations
  async getPackageFiles(packageId: number): Promise<PackageFile[]> {
    return await db
      .select()
      .from(packageFiles)
      .where(eq(packageFiles.packageId, packageId))
      .orderBy(desc(packageFiles.createdAt));
  }

  async createPackageFile(file: Omit<PackageFile, 'id' | 'createdAt'>): Promise<PackageFile> {
    const [newFile] = await db.insert(packageFiles).values(file).returning();
    return newFile;
  }

  async deletePackageFile(id: number): Promise<void> {
    await db.delete(packageFiles).where(eq(packageFiles.id, id));
  }
}

export const storage = new DatabaseStorage();