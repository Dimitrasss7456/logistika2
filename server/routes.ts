import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPackageSchema, insertLogistSchema, insertNotificationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Users management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const role = req.query.role;
      const users = role ? await storage.getUsersByRole(role) : await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Ошибка получения пользователей" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    console.log('=== POST /api/users запрос получен ===');
    console.log('Request body:', req.body);
    console.log('Current user:', req.user);

    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        console.log('Доступ запрещен для пользователя:', currentUser?.role);
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { firstName, lastName, email, role, telegramUsername, login, password, location, address, supportsLockers, supportsOffices } = req.body;

      console.log('Creating user with data:', { firstName, lastName, email, role, telegramUsername, login, password, location, address, supportsLockers, supportsOffices });

      // Use provided login and password
      const finalLogin = login || `${role}_${Date.now()}`;
      const finalPassword = password || "123456";

      console.log('Final credentials:', { finalLogin, finalPassword });

      const userData = {
        id: `${role}-${Date.now()}`,
        email: email || `${finalLogin}@generated.local`,
        login: finalLogin,
        firstName,
        lastName,
        telegramUsername,
        role,
        passwordHash: finalPassword,
        isActive: true,
      };

      console.log('User data to create:', userData);

      const newUser = await storage.createUser(userData);

      // If creating a logist, also create logist record
      if (role === 'logist') {
        await storage.createLogist({
          userId: newUser.id,
          location: req.body.location || 'Не указано',
          address: req.body.address || 'Не указано',
          supportsLockers: req.body.supportsLockers || false,
          supportsOffices: req.body.supportsOffices || false,
          isActive: true,
        });
      }

      res.json({ 
        user: newUser, 
        credentials: { login: finalLogin, password: finalPassword },
        message: "Пользователь создан успешно" 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Ошибка создания пользователя" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { role } = req.body;
      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "Роль пользователя обновлена" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Ошибка обновления роли" });
    }
  });

  app.put('/api/users/:id/access', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { isActive } = req.body;
      console.log('Updating user access:', { userId: req.params.id, isActive });
      await storage.toggleUserAccess(req.params.id, isActive);
      res.json({ message: "Доступ пользователя обновлен" });
    } catch (error) {
      console.error("Error updating user access:", error);
      res.status(500).json({ message: "Ошибка обновления доступа" });
    }
  });

  app.put('/api/users/:id/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { login, password } = req.body;
      await storage.updateUserCredentials(req.params.id, login, password);
      res.json({ message: "Данные пользователя обновлены" });
    } catch (error) {
      console.error("Error updating user credentials:", error);
      res.status(500).json({ message: "Ошибка обновления данных пользователя" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: "Пользователь удален" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Ошибка удаления пользователя" });
    }
  });

  // Logist routes
  app.get('/api/logists', isAuthenticated, async (req: any, res) => {
    try {
      const logists = await storage.getLogists();
      res.json(logists);
    } catch (error) {
      console.error("Error fetching logists:", error);
      res.status(500).json({ message: "Ошибка получения логистов" });
    }
  });

  app.post('/api/logists', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const validatedData = insertLogistSchema.parse(req.body);
      const logist = await storage.createLogist(validatedData);
      res.json(logist);
    } catch (error) {
      console.error("Error creating logist:", error);
      res.status(500).json({ message: "Ошибка создания логиста" });
    }
  });

  app.patch('/api/logists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const logist = await storage.updateLogist(parseInt(req.params.id), req.body);
      res.json(logist);
    } catch (error) {
      console.error("Error updating logist:", error);
      res.status(500).json({ message: "Ошибка обновления логиста" });
    }
  });

  // Package routes
  app.get('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const filters: any = {};

      // Role-based filtering
      if (currentUser?.role === 'client') {
        filters.clientId = currentUser.id;
      } else if (currentUser?.role === 'logist') {
        const logist = await storage.getLogistByUserId(currentUser.id);
        if (logist) {
          filters.logistId = logist.id;
        }
      }
      // Manager and admin see all packages (no filtering)

      // Additional filters from query params
      if (req.query.status && req.query.status !== 'all') filters.status = req.query.status;
      if (req.query.search && req.query.search.trim() !== '') filters.search = req.query.search;

      const packages = await storage.getPackages(filters);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Ошибка получения списка посылок" });
    }
  });

  app.get('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const packageData = await storage.getPackageById(packageId);

      if (!packageData) {
        return res.status(404).json({ message: "Посылка не найдена" });
      }

      // Check permissions
      const currentUser = req.user;
      if (currentUser?.role === 'client' && packageData.clientId !== currentUser.id) {
        return res.status(403).json({ message: "Доступ запрещен" });
      }
      if (currentUser?.role === 'logist') {
        const logist = await storage.getLogistByUserId(currentUser.id);
        if (logist && packageData.logistId !== logist.id) {
          return res.status(403).json({ message: "Доступ запрещен" });
        }
      }

      res.json(packageData);
    } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).json({ message: "Ошибка получения посылки" });
    }
  });

  app.post('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'client') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      // Validate required fields manually since insertPackageSchema expects all fields
      const requiredFields = {
        logistId: req.body.logistId,
        telegramUsername: req.body.telegramUsername,
        recipientName: req.body.recipientName,
        deliveryType: req.body.deliveryType,
        courierService: req.body.courierService,
        trackingNumber: req.body.trackingNumber,
        itemName: req.body.itemName,
        shopName: req.body.shopName,
      };

      // Check for missing required fields
      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(400).json({ message: `Поле ${key} обязательно для заполнения` });
        }
      }

      const packageData = {
        clientId: currentUser.id,
        logistId: parseInt(req.body.logistId),
        telegramUsername: req.body.telegramUsername,
        recipientName: req.body.recipientName,
        deliveryType: req.body.deliveryType,
        lockerAddress: req.body.lockerAddress || null,
        lockerCode: req.body.lockerCode || null,
        courierService: req.body.courierService,
        trackingNumber: req.body.trackingNumber,
        estimatedDeliveryDate: req.body.estimatedDeliveryDate ? new Date(req.body.estimatedDeliveryDate) : null,
        itemName: req.body.itemName,
        shopName: req.body.shopName,
        comments: req.body.comments || null,
        status: 'created_client',
        adminComments: null,
        paymentAmount: null,
        paymentDetails: null,
      };

      const createdPackage = await storage.createPackage(packageData);

      // Automatically create manager version of the package
      await storage.createPackage({
        ...packageData,
        status: 'created_manager',
      });

      // Уведомить менеджеров о новой посылке
      const managers = await storage.getUsersByRole('admin');

      for (const manager of managers) {
        await storage.createNotification({
          userId: manager.id,
          title: 'Новая посылка',
          message: `Создана новая посылка ${createdPackage.uniqueNumber} от клиента ${currentUser.firstName} ${currentUser.lastName}`,
          type: 'system',
          packageId: createdPackage.id,
        });
      }

      res.json(createdPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      console.error("Request body:", req.body);
      res.status(500).json({ 
        message: "Ошибка создания посылки", 
        error: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    }
  });

  app.patch('/api/packages/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const { status, adminComments } = req.body;

      console.log('Updating package status:', { packageId, status, adminComments });

      const currentUser = req.user;
      console.log('Current user role:', currentUser?.role);

      // Allow logists to update status for their own packages
      if (currentUser?.role === 'logist') {
        const packageData = await storage.getPackageById(packageId);
        if (!packageData || packageData.logist.userId !== currentUser.id) {
          return res.status(403).json({ message: "Доступ запрещен - не ваша посылка" });
        }
      } else if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      if (!status) {
        return res.status(400).json({ message: "Статус обязателен" });
      }

      const updatedPackage = await storage.updatePackageStatus(packageId, status, adminComments);

      // Implement automatic status transitions according to ТЗ workflow
      const packageData = await storage.getPackageById(packageId);
      if (packageData) {
        // Handle automatic transitions
        if (status === 'sent_to_logist_manager') {
          // Create logist version when manager sends to logist
          await storage.createPackage({
            uniqueNumber: packageData.uniqueNumber,
            clientId: packageData.clientId,
            logistId: packageData.logistId,
            telegramUsername: packageData.telegramUsername,
            recipientName: packageData.recipientName,
            deliveryType: packageData.deliveryType,
            lockerAddress: packageData.lockerAddress,
            lockerCode: packageData.lockerCode,
            courierService: packageData.courierService,
            trackingNumber: packageData.trackingNumber,
            estimatedDeliveryDate: packageData.estimatedDeliveryDate,
            itemName: packageData.itemName,
            shopName: packageData.shopName,
            comments: packageData.comments,
            status: 'received_info_logist',
            adminComments: packageData.adminComments,
            paymentAmount: packageData.paymentAmount,
            paymentDetails: packageData.paymentDetails,
          });

          // Notify logist
          await storage.createNotification({
            userId: packageData.logist.userId,
            title: 'Новая посылка для получения',
            message: `Получена информация о посылке ${packageData.uniqueNumber}`,
            type: 'system',
            packageId: packageId,
          });
        }

        // Notify relevant parties about status change
        await storage.createNotification({
          userId: packageData.clientId,
          title: 'Изменение статуса',
          message: `Посылка #${packageData.uniqueNumber} изменила статус`,
          type: 'system',
          packageId: packageId,
        });
      }

      console.log('Package status updated successfully:', updatedPackage);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package status:", error);
      res.status(500).json({ message: "Ошибка обновления статуса посылки", error: error.message });
    }
  });

  // Package workflow action routes
  app.post('/api/packages/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'client') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      const { confirmed, fileUrl } = req.body;

      // Update client status
      const clientStatus = confirmed ? 'awaiting_processing_client' : 'awaiting_processing_client';
      const updatedPackage = await storage.updatePackageStatus(packageId, clientStatus);

      // Create manager notification for confirmation
      const managers = await storage.getUsersByRole('admin');
      for (const manager of managers) {
        await storage.createNotification({
          userId: manager.id,
          title: confirmed ? 'Клиент подтвердил посылку' : 'Клиент отклонил посылку',
          message: `Посылка ${updatedPackage.uniqueNumber} ${confirmed ? 'подтверждена' : 'отклонена'} клиентом`,
          type: 'system',
          packageId: packageId,
        });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error confirming package:", error);
      res.status(500).json({ message: "Ошибка подтверждения посылки", error: error.message });
    }
  });

  // Logist confirms package receipt with proof
  app.post('/api/packages/:id/logist-confirm', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'logist') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      const { proofUrl } = req.body;

      // Update logist status to "received"
      const updatedPackage = await storage.updatePackageStatus(packageId, 'package_received_logist');

      // Notify managers
      const managers = await storage.getUsersByRole('admin');
      for (const manager of managers) {
        await storage.createNotification({
          userId: manager.id,
          title: 'Логист подтвердил получение',
          message: `Логист подтвердил получение посылки ${updatedPackage.uniqueNumber}`,
          type: 'system',
          packageId: packageId,
        });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error confirming package receipt:", error);
      res.status(500).json({ message: "Ошибка подтверждения получения", error: error.message });
    }
  });

  // Logist ships package with proof
  app.post('/api/packages/:id/ship', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'logist') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      const { proofUrl } = req.body;

      // Update logist status to "shipped"
      const updatedPackage = await storage.updatePackageStatus(packageId, 'shipped_logist');

      // Notify managers
      const managers = await storage.getUsersByRole('admin');
      for (const manager of managers) {
        await storage.createNotification({
          userId: manager.id,
          title: 'Посылка отправлена логистом',
          message: `Логист отправил посылку ${updatedPackage.uniqueNumber}`,
          type: 'system',
          packageId: packageId,
        });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error shipping package:", error);
      res.status(500).json({ message: "Ошибка отправки посылки", error: error.message });
    }
  });

  // Client payment confirmation
  app.post('/api/packages/:id/pay', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'client') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      const { paymentProof, fileUrl } = req.body;

      // Update client status to "awaiting shipping"
      const updatedPackage = await storage.updatePackageStatus(packageId, 'awaiting_shipping_client');

      // Notify managers about payment
      const managers = await storage.getUsersByRole('admin');
      for (const manager of managers) {
        await storage.createNotification({
          userId: manager.id,
          title: 'Клиент оплатил посылку',
          message: `Получена оплата за посылку ${updatedPackage.uniqueNumber}`,
          type: 'system',
          packageId: packageId,
        });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Ошибка обработки оплаты", error: error.message });
    }
  });

  app.post('/api/packages/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const packageId = parseInt(req.params.id);

      let newStatus = '';
      if (currentUser?.role === 'logist') {
        newStatus = 'sent_by_logist';
      } else if (currentUser?.role === 'admin') {
        newStatus = 'sent_client';
      }

      const updatedPackage = await storage.updatePackageStatus(packageId, newStatus);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error sending package:", error);
      res.status(500).json({ message: "Ошибка отправки посылки" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const notifications = await storage.getNotifications(currentUser.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Ошибка получения уведомлений" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(parseInt(req.params.id));
      res.json({ message: "Уведомление отмечено как прочитанное" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Ошибка обновления уведомления" });
    }
  });

  // Message routes
  app.get('/api/packages/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const messages = await storage.getPackageMessages(packageId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Ошибка получения сообщений" });
    }
  });

  app.post('/api/packages/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const packageId = parseInt(req.params.id);

      const message = await storage.createMessage({
        packageId,
        senderId: currentUser.id,
        message: req.body.message,
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Ошибка создания сообщения" });
    }
  });

  // File upload routes
  app.post('/api/packages/:id/files', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      const currentUser = req.user;
      const packageId = parseInt(req.params.id);
      const { fileType } = req.body;

      const fileRecord = await storage.createPackageFile({
        packageId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: currentUser.id,
        fileType: fileType || 'document',
      });

      res.json(fileRecord);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Ошибка загрузки файла" });
    }
  });

  app.get('/api/packages/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const files = await storage.getPackageFiles(packageId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Ошибка получения файлов" });
    }
  });

  // Password reset request
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email обязателен" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Пользователь с таким email не найден" });
      }

      // Create notification for all admin users
      const adminUsers = await storage.getUsersByRole('admin');
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: 'Запрос сброса пароля',
          message: `Пользователь ${user.firstName} ${user.lastName} (${user.email}) запросил сброс пароля. Telegram: ${user.telegramUsername || 'не указан'}`,
          type: 'password_reset',
        });
      }

      res.json({ message: "Запрос на сброс пароля отправлен администратору" });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Ошибка обработки запроса" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Get user by email first
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Аккаунт деактивирован" });
      }

      // For demo purposes, compare passwords directly
      // In production, you should hash passwords properly
      if (user.passwordHash !== password) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      // Set up session (simplified for demo)
      req.session.userId = user.id;
      req.session.user = user;

      res.json({ message: "Вход выполнен", user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Ошибка входа" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.json({ message: "Выход выполнен" });
    });
  });

  app.delete('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      await storage.deletePackageById(packageId);
      res.json({ message: "Посылка удалена" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Ошибка удаления посылки" });
    }
  });

  // Передача посылки логисту менеджером
  app.post('/api/packages/:id/send-to-logist', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      const pkg = await storage.getPackageById(packageId);

      if (!pkg) {
        return res.status(404).json({ message: "Посылка не найдена" });
      }

      if (pkg.status !== 'created_manager') {
        return res.status(400).json({ message: "Посылка не в статусе для передачи логисту" });
      }

      // Обновить статус посылки
      await storage.updatePackageStatus(packageId, 'sent_to_logist');

      // Уведомить логиста
      const logist = await storage.getLogistByUserId(pkg.logistId);
      if(logist){
           await storage.createNotification({
            userId: logist.userId,
            title: 'Новая посылка для обработки',
            message: `Вам передана посылка ${pkg.uniqueNumber} для обработки`,
            type: 'system'
          });
      }


      res.json({ message: "Посылка передана логисту" });
    } catch (error) {
      console.error("Error sending package to logist:", error);
      res.status(500).json({ message: "Ошибка передачи посылки" });
    }
  });

  // Admin routes for complete system management
  app.get('/api/admin/packages', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packages = await storage.getPackages({});
      res.json(packages);
    } catch (error) {
      console.error("Error fetching admin packages:", error);
      res.status(500).json({ message: "Ошибка получения посылок" });
    }
  });

  app.delete('/api/admin/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packageId = parseInt(req.params.id);
      await storage.deletePackageById(packageId);
      res.json({ message: "Посылка удалена" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Ошибка удаления посылки" });
    }
  });

  app.post('/api/admin/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { recipients, title, message, type } = req.body;

      let targetUsers: any[] = [];

      if (recipients === 'all') {
        targetUsers = await storage.getAllUsers();
      } else {
        targetUsers = await storage.getUsersByRole(recipients.replace('s', '')); // clients -> client
      }

      // Create notifications for all target users
      for (const user of targetUsers) {
        await storage.createNotification({
          userId: user.id,
          title,
          message,
          type: type || 'system',
        });
      }

      res.json({ message: `Уведомление отправлено ${targetUsers.length} пользователям` });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Ошибка отправки уведомления" });
    }
  });

  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packages = await storage.getPackages({});
      const users = await storage.getAllUsers();
      const logists = await storage.getLogists();

      const analytics = {
        totalPackages: packages.length,
        totalUsers: users.length,
        totalLogists: logists.length,
        packagesByStatus: packages.reduce((acc: any, pkg: any) => {
          acc[pkg.status] = (acc[pkg.status] || 0) + 1;
          return acc;
        }, {}),
        usersByRole: users.reduce((acc: any, user: any) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        activeUsers: users.filter((u: any) => u.isActive).length,
        activeLogists: logists.filter((l: any) => l.isActive).length,
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Ошибка получения аналитики" });
    }
  });

  app.patch('/api/admin/users/:id/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { login, password } = req.body;
      await storage.updateUserCredentials(req.params.id, login, password);
      res.json({ message: "Данные пользователя обновлены" });
    } catch (error) {
      console.error("Error updating user credentials:", error);
      res.status(500).json({ message: "Ошибка обновления данных пользователя" });
    }
  });

  app.get('/api/admin/system-status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const packages = await storage.getPackages({});
      const users = await storage.getAllUsers();
      const logists = await storage.getLogists();
      const notifications = await storage.getNotifications('admin-001'); // Get system notifications

      const systemStatus = {
        health: 'healthy',
        uptime: process.uptime(),
        totalPackages: packages.length,
        activePackages: packages.filter((p: any) => !['paid_manager', 'shipped_client'].includes(p.status)).length,
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        totalLogists: logists.length,
        activeLogists: logists.filter((l: any) => l.isActive).length,
        unreadNotifications: notifications.filter((n: any) => !n.isRead).length,
        lastActivity: new Date().toISOString(),
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Ошибка получения статуса системы" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}