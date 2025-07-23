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
  updateUserCredentials(userId: string, login?: string, password?: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;

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
  deletePackageById(id: number): Promise<Package[]>;

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

  // Admin operations
  updateUserCredentials(userId: string, login: string, password: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getSystemAnalytics(): Promise<{
    packages: {
      total: number;
      byStatus: { [key: string]: number };
    };
    users: {
      total: number;
      active: number;
      byRole: { [key: string]: number };
    };
    logists: {
      total: number;
      active: number;
    };
  }>;
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
    console.log('Storage: Creating user with data:', userData);

    // Generate proper ID if not provided
    if (!userData.id) {
      userData.id = `${userData.role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Ensure required fields are present
    const userToCreate = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    };

    const [newUser] = await db.insert(users).values([userToCreate]).returning();
    console.log('Storage: User created successfully:', newUser);
    return newUser;
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

  async validateCredentials(login: string, password: string): Promise<User | null> {
    console.log('validateCredentials called with:', login, password);

    // Find user by login only
    const user = await db
      .select()
      .from(users)
      .where(eq(users.login, login))
      .limit(1);

    console.log('Found user:', user);

    if (user.length === 0) {
      console.log('No user found');
      return null;
    }

    const foundUser = user[0];

    if (!foundUser.isActive) {
      console.log('User is not active');
      return null;
    }

    // Simple password comparison
    if (foundUser.passwordHash === password) {
      console.log('Password matches and user is active');
      return foundUser;
    }

    console.log('Password does not match');
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
    console.log('Toggling user access in storage:', { userId, isActive });
    const result = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    console.log('User access toggled successfully:', result);
  }

  async updateUserCredentials(userId: string, login?: string, password?: string): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    if (login) updateData.login = login;
    if (password) updateData.passwordHash = password; // Store as plain text as requested

    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // First, check if user has any packages
    const userPackages = await db.select().from(packages).where(eq(packages.clientId, userId));

    if (userPackages.length > 0) {
      throw new Error('Невозможно удалить пользователя: у него есть посылки');
    }

    // Delete logist record if exists
    await db.delete(logists).where(eq(logists.userId, userId));

    // Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // Delete messages
    await db.delete(messages).where(eq(messages.senderId, userId));

    // Finally delete user
    await db.delete(users).where(eq(users.id, userId));
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
    // Get logist info for unique package number
    const logist = await db.select().from(logists).where(eq(logists.id, packageData.logistId)).limit(1);
    const logistUser = logist[0] ? await db.select().from(users).where(eq(users.id, logist[0].userId)).limit(1) : null;

    // Generate unique package number in format PP-111111 (logist initials + number)
    const logistInitials = logistUser && logistUser[0] 
      ? (logistUser[0].firstName?.substring(0, 1) || 'L') + (logistUser[0].lastName?.substring(0, 1) || 'L')
      : 'LL';

    const packageNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const uniqueNumber = `${logistInitials.toUpperCase()}-${packageNumber}`;

    const packageWithNumber = { ...packageData, uniqueNumber, status: 'created_client' as const };

    const [newPackage] = await db.insert(packages).values([packageWithNumber]).returning();

    // Create notifications ONLY for managers (not logists at this stage)
    try {
      const managerUsers = await this.getUsersByRole('manager');
      console.log('Found manager users:', managerUsers);
      for (const manager of managerUsers) {
        if (manager && manager.id) {
          console.log('Creating notification for manager:', manager.id);
          await this.createNotification({
            userId: manager.id,
            title: 'Новая посылка от клиента',
            message: `Клиент создал новую посылку ${uniqueNumber}. Необходимо проверить данные и передать логисту.`,
            type: 'package_status',
            packageId: newPackage.id
          });
        }
      }

      // Create admin notification
      const adminUsers = await this.getUsersByRole('admin');
      console.log('Found admin users:', adminUsers);
      for (const admin of adminUsers) {
        if (admin && admin.id) {
          console.log('Creating notification for admin:', admin.id);
          await this.createNotification({
            userId: admin.id,
            title: 'Новая посылка создана',
            message: `Клиент создал новую посылку ${uniqueNumber}`,
            type: 'package_status',
            packageId: newPackage.id
          });
        }
      }
    } catch (error) {
      console.error('Error creating notifications:', error);
      // Continue without failing - notifications are not critical
    }

    return newPackage;
  }

  async updatePackageStatus(id: number, status: string, adminComments?: string): Promise<Package> {
    console.log('Storage: updating package status', { id, status, adminComments });

    const updateData: any = { 
      status,
      updatedAt: new Date()
    };

    if (adminComments !== undefined) {
      updateData.adminComments = adminComments;
    }

    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, id))
      .returning();

    if (!updatedPackage) {
      throw new Error('Посылка не найдена');
    }

    // Create notifications based on status change
    await this.createStatusChangeNotifications(updatedPackage, status);

    console.log('Storage: package status updated successfully', updatedPackage);
    return updatedPackage;
  }

  // Helper function to create notifications for status changes
  private async createStatusChangeNotifications(pkg: Package, newStatus: string) {
    try {
      const packageData = await this.getPackageById(pkg.id);
      if (!packageData) return;

      // Get logist user for notifications
      const logistUser = packageData.logist?.user;

      switch (newStatus) {
        case 'sent_to_logist':
          // Notify logist that package was sent to them
          if (logistUser) {
            await this.createNotification({
              userId: logistUser.id,
              title: 'Получена информация о посылке',
              message: `Менеджер передал вам посылку ${pkg.uniqueNumber}. Необходимо подтвердить получение.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;

        case 'received_by_logist':
          // Notify managers that logist received package
          const managerUsers = await this.getUsersByRole('manager');
          for (const manager of managerUsers) {
            await this.createNotification({
              userId: manager.id,
              title: 'Посылка получена логистом',
              message: `Логист получил посылку ${pkg.uniqueNumber}. Ожидает подтверждения.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;

        case 'logist_confirmed':
          // Notify managers that logist confirmed
          const managers = await this.getUsersByRole('manager');
          for (const manager of managers) {
            await this.createNotification({
              userId: manager.id,
              title: 'Логист подтвердил получение',
              message: `Логист подтвердил получение посылки ${pkg.uniqueNumber}. Необходимо отправить информацию клиенту.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;

        case 'info_sent_to_client':
          // Notify client that info was sent
          await this.createNotification({
            userId: packageData.client.id,
            title: 'Информация о посылке получена',
            message: `Получена информация о посылке ${pkg.uniqueNumber}. Необходимо подтвердить получение.`,
            type: 'package_status',
            packageId: pkg.id
          });
          break;

        case 'confirmed_by_client':
          // Notify managers that client confirmed
          const managersForClient = await this.getUsersByRole('manager');
          for (const manager of managersForClient) {
            await this.createNotification({
              userId: manager.id,
              title: 'Клиент подтвердил получение',
              message: `Клиент подтвердил получение информации о посылке ${pkg.uniqueNumber}. Необходимо обработать оплату.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;

        case 'awaiting_payment':
          // Notify client about payment
          await this.createNotification({
            userId: packageData.client.id,
            title: 'Ожидает оплаты',
            message: `Необходима оплата за посылку ${pkg.uniqueNumber}.`,
            type: 'package_status',
            packageId: pkg.id
          });
          break;

        case 'awaiting_shipping':
          // Notify logist about shipping
          if (logistUser) {
            await this.createNotification({
              userId: logistUser.id,
              title: 'Готово к отправке',
              message: `Посылка ${pkg.uniqueNumber} готова к отправке. Необходимо отправить посылку.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;

        case 'shipped':
          // Notify client about shipping
          await this.createNotification({
            userId: packageData.client.id,
            title: 'Посылка отправлена',
            message: `Ваша посылка ${pkg.uniqueNumber} отправлена логистом.`,
            type: 'package_status',
            packageId: pkg.id
          });
          break;

        case 'paid':
          // Notify logist about payment
          if (logistUser) {
            await this.createNotification({
              userId: logistUser.id,
              title: 'Оплата получена',
              message: `Оплата за посылку ${pkg.uniqueNumber} получена.`,
              type: 'package_status',
              packageId: pkg.id
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error creating status change notifications:', error);
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

  async deletePackageById(id: number) {
    return await db.delete(packages).where(eq(packages.id, id)).returning();
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



  async getSystemAnalytics(): Promise<{
    packages: {
      total: number;
      byStatus: { [key: string]: number };
    };
    users: {
      total: number;
      active: number;
      byRole: { [key: string]: number };
    };
    logists: {
      total: number;
      active: number;
    };
  }> {
    const allPackages = await this.getPackages({});
    const allUsers = await this.getAllUsers();
    const allLogists = await this.getLogists();

    return {
      packages: {
        total: allPackages.length,
        byStatus: allPackages.reduce((acc: any, pkg: any) => {
          acc[pkg.status] = (acc[pkg.status] || 0) + 1;
          return acc;
        }, {}),
      },
      users: {
        total: allUsers.length,
        active: allUsers.filter((u: any) => u.isActive).length,
        byRole: allUsers.reduce((acc: any, user: any) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
      },
      logists: {
        total: allLogists.length,
        active: allLogists.filter((l: any) => l.isActive).length,
      },
    };
  }
}

export const storage = new DatabaseStorage();