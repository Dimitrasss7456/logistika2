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

  async validateCredentials(email: string, password: string): Promise<User | null> {
    // Hardcoded credentials for demo
    const credentials = {
      'admin@package.ru': { password: '123456', role: 'admin', id: 'admin-001' },
      'logist@package.ru': { password: '123456', role: 'logist', id: 'logist-001' },
      'client@package.ru': { password: '123456', role: 'client', id: 'client-001' }
    };

    const cred = credentials[email as keyof typeof credentials];
    if (cred && cred.password === password) {
      // Check if user exists, if not create them
      let user = await this.getUserByEmail(email);
      if (!user) {
        user = await this.createUser({
          id: cred.id,
          email: email,
          firstName: cred.role === 'admin' ? 'Администратор' : cred.role === 'logist' ? 'Логист' : 'Клиент',
          lastName: 'Системы',
          role: cred.role as any,
          isActive: true
        });
      }
      return user;
    }
    return null;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
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
    const packageWithNumber = { ...packageData, uniqueNumber };
    
    const [newPackage] = await db.insert(packages).values([packageWithNumber]).returning();
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
    return updatedPackage;
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