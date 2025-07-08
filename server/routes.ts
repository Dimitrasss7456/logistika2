import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
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
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const users = await storage.getUsersByRole('client');
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Ошибка получения пользователей" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
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

  app.patch('/api/users/:id/access', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const { isActive } = req.body;
      await storage.toggleUserAccess(req.params.id, isActive);
      res.json({ message: "Доступ пользователя обновлен" });
    } catch (error) {
      console.error("Error updating user access:", error);
      res.status(500).json({ message: "Ошибка обновления доступа" });
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

      // Additional filters from query params
      if (req.query.status) filters.status = req.query.status;
      if (req.query.search) filters.search = req.query.search;

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

      const validatedData = insertPackageSchema.parse({
        ...req.body,
        clientId: currentUser.id,
      });

      const createdPackage = await storage.createPackage(validatedData);
      
      // Create notification for admin
      await storage.createNotification({
        userId: 'admin-001', // Admin user ID
        title: 'Новая посылка',
        message: `Создана новая посылка #${createdPackage.uniqueNumber}`,
        type: 'package_status',
        packageId: createdPackage.id,
      });

      res.json(createdPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Ошибка создания посылки" });
    }
  });

  app.patch('/api/packages/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const { status, adminComments } = req.body;
      
      const currentUser = req.user;
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const updatedPackage = await storage.updatePackageStatus(packageId, status, adminComments);
      
      // Create notification for client and logist
      const packageData = await storage.getPackageById(packageId);
      if (packageData) {
        await storage.createNotification({
          userId: packageData.clientId,
          title: 'Изменение статуса',
          message: `Посылка #${packageData.uniqueNumber} изменила статус`,
          type: 'package_status',
          packageId: packageId,
        });
      }

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package status:", error);
      res.status(500).json({ message: "Ошибка обновления статуса посылки" });
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

  const httpServer = createServer(app);
  return httpServer;
}