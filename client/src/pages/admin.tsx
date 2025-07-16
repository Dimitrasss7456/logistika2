import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Users, Settings, BarChart3, Plus, Copy } from "lucide-react";
import { usePackages, useUpdatePackageStatus } from "@/hooks/usePackages";
import { useUsers, useUpdateUserRole, useToggleUserAccess, useLogists, useUpdateUserCredentials, useDeleteUser } from "@/hooks/useUsers";
import { Package as PackageType, User } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Edit, UserCheck, UserX, TrendingUp, Calendar, DollarSign, Activity, Save, RefreshCw, Database, Server, Mail, Globe, Shield, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const updatePackageStatus = useUpdatePackageStatus();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизованный доступ",
        description: "Вы не авторизованы. Перенаправляем на страницу входа...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Redirect if user is not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);

  const { data: packages, isLoading: packagesLoading } = usePackages({
    status: statusFilter === "all" ? "" : statusFilter,
    search: searchTerm,
  });

  const handleStatusUpdate = async (packageId: number, newStatus: string, adminComments?: string) => {
    try {
      await updatePackageStatus.mutateAsync({
        id: packageId,
        status: newStatus as any,
        adminComments,
      });
      toast({
        title: "Успех",
        description: "Статус посылки обновлен",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Неавторизованный доступ",
          description: "Вы не авторизованы. Выполняется вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/login");
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'created': 'Создана',
      'sent_to_logist': 'Передана логисту',
      'logist_confirmed': 'Логист подтвердил получение',
      'info_sent_to_client': 'Передана информация клиенту',
      'confirmed_by_client': 'Подтверждена клиентом',
      'awaiting_payment_admin': 'Ожидает оплаты',
      'awaiting_processing_admin': 'Ожидает обработки',
      'awaiting_shipping_admin': 'Ожидает отправки',
      'sent_by_logist': 'Отправлена логистом',
      'paid_admin': 'Оплачена',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'created': 'bg-blue-100 text-blue-800',
      'sent_to_logist': 'bg-yellow-100 text-yellow-800',
      'logist_confirmed': 'bg-green-100 text-green-800',
      'info_sent_to_client': 'bg-purple-100 text-purple-800',
      'confirmed_by_client': 'bg-indigo-100 text-indigo-800',
      'awaiting_payment_admin': 'bg-orange-100 text-orange-800',
      'awaiting_processing_admin': 'bg-amber-100 text-amber-800',
      'awaiting_shipping_admin': 'bg-cyan-100 text-cyan-800',
      'sent_by_logist': 'bg-emerald-100 text-emerald-800',
      'paid_admin': 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель администратора
          </h1>
          <p className="text-gray-600">
            Управление посылками, пользователями и системой
          </p>
        </div>

        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Посылки
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Все посылки</h2>
              <p className="text-gray-600">Управление всеми посылками в системе</p>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Поиск по номеру посылки, получателю или товару..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="created">Создана</SelectItem>
                      <SelectItem value="sent_to_logist">Передана логисту</SelectItem>
                      <SelectItem value="logist_confirmed">Логист подтвердил</SelectItem>
                      <SelectItem value="info_sent_to_client">Передана клиенту</SelectItem>
                      <SelectItem value="confirmed_by_client">Подтверждена клиентом</SelectItem>
                      <SelectItem value="awaiting_payment_admin">Ожидает оплаты</SelectItem>
                      <SelectItem value="awaiting_processing_admin">Ожидает обработки</SelectItem>
                      <SelectItem value="awaiting_shipping_admin">Ожидает отправки</SelectItem>
                      <SelectItem value="sent_by_logist">Отправлена логистом</SelectItem>
                      <SelectItem value="paid_admin">Оплачена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Packages List */}
            {packagesLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : packages?.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Посылки не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {packages?.map((pkg) => (
                  <AdminPackageCard
                    key={pkg.id}
                    package={pkg}
                    onStatusUpdate={handleStatusUpdate}
                    getStatusText={getStatusText}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab packages={packages} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AdminPackageCard({
  package: pkg,
  onStatusUpdate,
  getStatusText,
  getStatusColor,
}: {
  package: PackageType;
  onStatusUpdate: (id: number, status: string, comments?: string) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}) {
  const [adminComments, setAdminComments] = useState(pkg.adminComments || "");

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(pkg.id, newStatus, adminComments);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Посылка #{pkg.uniqueNumber}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Создана {new Date(pkg.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getStatusColor(pkg.status)}>
            {getStatusText(pkg.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Клиент</dt>
            <dd className="text-sm text-gray-900">{pkg.client.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Логист</dt>
            <dd className="text-sm text-gray-900">{pkg.logist.location}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Получатель</dt>
            <dd className="text-sm text-gray-900">{pkg.recipientName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Товар</dt>
            <dd className="text-sm text-gray-900">{pkg.itemName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Трекинг</dt>
            <dd className="text-sm text-gray-900">{pkg.trackingNumber}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Курьерская служба</dt>
            <dd className="text-sm text-gray-900">{pkg.courierService}</dd>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Комментарии администратора</label>
            <Textarea
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              placeholder="Добавить комментарий..."
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Изменить статус</label>
            <Select value={pkg.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Создана</SelectItem>
                <SelectItem value="sent_to_logist">Передана логисту</SelectItem>
                <SelectItem value="logist_confirmed">Логист подтвердил получение</SelectItem>
                <SelectItem value="info_sent_to_client">Передана информация клиенту</SelectItem>
                <SelectItem value="confirmed_by_client">Подтверждена клиентом</SelectItem>
                <SelectItem value="awaiting_payment_admin">Ожидает оплаты</SelectItem>
                <SelectItem value="awaiting_processing_admin">Ожидает обработки</SelectItem>
                <SelectItem value="awaiting_shipping_admin">Ожидает отправки</SelectItem>
                <SelectItem value="sent_by_logist">Отправлена логистом</SelectItem>
                <SelectItem value="paid_admin">Оплачена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab({ packages }: { packages?: PackageType[] }) {
  const { data: users } = useUsers();
  const { data: logists } = useLogists();

  // Подсчеты для аналитики
  const totalPackages = packages?.length || 0;
  const totalUsers = users?.length || 0;
  const totalLogists = logists?.length || 0;
  const totalClients = users?.filter(u => u.role === 'client').length || 0;

  // Статистика по статусам посылок
  const statusStats = packages?.reduce((acc, pkg) => {
    acc[pkg.status] = (acc[pkg.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Статистика за последние 30 дней
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentPackages = packages?.filter(pkg => 
    new Date(pkg.createdAt) >= last30Days
  ) || [];

  // Самые активные логисты
  const logistStats = packages?.reduce((acc, pkg) => {
    const logistName = pkg.logist?.user?.firstName + ' ' + pkg.logist?.user?.lastName;
    acc[logistName] = (acc[logistName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topLogists = Object.entries(logistStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Аналитика системы</h2>
        <p className="text-gray-600">Статистика и показатели эффективности</p>
      </div>

      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего посылок</p>
                <p className="text-2xl font-bold text-gray-900">{totalPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Логисты</p>
                <p className="text-2xl font-bold text-gray-900">{totalLogists}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">За 30 дней</p>
                <p className="text-2xl font-bold text-gray-900">{recentPackages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по статусам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Статистика по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / totalPackages) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Топ логисты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLogists.length > 0 ? topLogists.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{count} посылок</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительная аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Активность за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{recentPackages.length}</p>
              <p className="text-sm text-gray-600">новых посылок</p>
              <p className="text-xs text-gray-500 mt-2">
                {totalPackages > 0 ? 
                  `${Math.round((recentPackages.length / totalPackages) * 100)}% от общего количества` 
                  : 'Нет данных'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Соотношение ролей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Клиенты:</span>
                <span className="text-sm font-medium">{totalClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Логисты:</span>
                <span className="text-sm font-medium">{totalLogists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Администраторы:</span>
                <span className="text-sm font-medium">
                  {users?.filter(u => u.role === 'admin').length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Статус системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">База данных:</span>
                <Badge className="bg-green-100 text-green-800">Активна</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API:</span>
                <Badge className="bg-green-100 text-green-800">Работает</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Уведомления:</span>
                <Badge className="bg-green-100 text-green-800">Включены</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'Система управления посылками',
    adminEmail: 'admin@package.ru',
    notificationsEnabled: true,
    autoAssignLogist: false,
    requireEmailVerification: false,
    maxFileSize: 50,
    allowedFileTypes: 'jpeg,jpg,png,gif,pdf,doc,docx,mp4,mov,avi',
    sessionTimeout: 168, // hours
    maintenanceMode: false,
    debugMode: false,
  });

  const handleSaveSettings = () => {
    // В реальном приложении здесь был бы API вызов
    toast({
      title: "Настройки сохранены",
      description: "Настройки системы успешно обновлены",
    });
  };

  const handleResetSettings = () => {
    setSettings({
      siteName: 'Система управления посылками',
      adminEmail: 'admin@package.ru',
      notificationsEnabled: true,
      autoAssignLogist: false,
      requireEmailVerification: false,
      maxFileSize: 50,
      allowedFileTypes: 'jpeg,jpg,png,gif,pdf,doc,docx,mp4,mov,avi',
      sessionTimeout: 168,
      maintenanceMode: false,
      debugMode: false,
    });
    toast({
      title: "Настройки сброшены",
      description: "Настройки системы сброшены к значениям по умолчанию",
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Настройки системы</h2>
        <p className="text-gray-600">Конфигурация и параметры системы</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Общие
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Система
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Основные настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Название сайта</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email администратора</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoAssignLogist"
                  checked={settings.autoAssignLogist}
                  onChange={(e) => setSettings({...settings, autoAssignLogist: e.target.checked})}
                />
                <Label htmlFor="autoAssignLogist">Автоматическое назначение логиста</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Настройки уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                />
                <Label htmlFor="notificationsEnabled">Включить уведомления</Label>
              </div>
              <div className="space-y-2">
                <Label>Настройки email уведомлений</Label>
                <p className="text-sm text-gray-600">
                  Email уведомления отправляются автоматически при изменении статуса посылки
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                />
                <Label htmlFor="requireEmailVerification">Требовать подтверждение email</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Время сессии (часы)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Максимальный размер файла (МБ)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Разрешенные типы файлов</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                  placeholder="jpeg,jpg,png,pdf"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Системные настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                />
                <Label htmlFor="maintenanceMode">Режим технического обслуживания</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={settings.debugMode}
                  onChange={(e) => setSettings({...settings, debugMode: e.target.checked})}
                />
                <Label htmlFor="debugMode">Режим отладки</Label>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Действия</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Создать резервную копию БД
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Очистить кэш системы
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Кнопки сохранения */}
      <div className="flex gap-4 pt-6 border-t">
        <Button onClick={handleSaveSettings} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Сохранить настройки
        </Button>
        <Button variant="outline" onClick={handleResetSettings} className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Сбросить к умолчанию
        </Button>
      </div>
    </div>
  );
}

function UserManagement() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{login: string, password: string} | null>(null);

  const { data: users, isLoading: usersLoading } = useUsers(selectedRole === 'all' ? undefined : selectedRole);
  const { data: logists, isLoading: logistsLoading } = useLogists();
  const updateUserRole = useUpdateUserRole();
  const toggleUserAccess = useToggleUserAccess();
  const updateUserCredentials = useUpdateUserCredentials();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredUsers = users?.filter((user: User) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.telegramUsername?.toLowerCase().includes(searchLower)
    );
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handleAccessToggle = (userId: string, currentAccess: boolean) => {
    toggleUserAccess.mutate({ userId, isActive: !currentAccess });
  };

  const handleUpdateCredentials = (userId: string, login: string, password: string) => {
    updateUserCredentials.mutate({ userId, login, password });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser.mutate(userId);
  };

  // Новая система создания пользователей
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    login: '',
    password: '',
    email: '',
    telegramUsername: '',
    role: '',
    location: '',
    address: '',
    supportsLockers: false,
    supportsOffices: false,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log('Отправляем данные пользователя:', userData);
      try {
        const response = await apiRequest("POST", "/api/users", userData);
        console.log('Ответ сервера:', response);
        return response;
      } catch (error) {
        console.error('Ошибка API запроса:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Пользователь успешно создан:', data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["logists"] });

      if (data && data.credentials) {
        setGeneratedCredentials(data.credentials);
      }

      // Сбрасываем форму
      setNewUserData({
        firstName: '',
        lastName: '',
        login: '',
        password: '',
        email: '',
        telegramUsername: '',
        role: '',
        location: '',
        address: '',
        supportsLockers: false,
        supportsOffices: false,
      });

      toast({
        title: "Пользователь создан",
        description: data?.credentials ? `Пользователь с логином ${data.credentials.login} успешно создан` : "Пользователь успешно создан",
      });
    },
    onError: (error) => {
      console.error('Ошибка создания пользователя:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    console.log('Данные перед отправкой:', newUserData);
    createUserMutation.mutate(newUserData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Данные скопированы в буфер обмена",
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Управление пользователями</h2>
        <p className="text-gray-600">Управление ролями и доступом пользователей</p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Поиск по email, имени или Telegram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="admin">Администраторы</SelectItem>
                <SelectItem value="manager">Менеджеры</SelectItem>
                <SelectItem value="logist">Логисты</SelectItem>
                <SelectItem value="client">Клиенты</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Создать пользователя
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Создать нового пользователя</DialogTitle>
                </DialogHeader>
                {generatedCredentials ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Пользователь создан!</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Логин:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{generatedCredentials.login}</code>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.login)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Пароль:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{generatedCredentials.password}</code>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.password)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Сохраните эти данные, они больше не будут показаны
                      </p>
                    </div>
                    <Button onClick={() => {
                      setGeneratedCredentials(null);
                      setIsCreateModalOpen(false);
                    }} className="w-full">
                      Закрыть
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Имя</Label>
                        <Input 
                          id="firstName" 
                          value={newUserData.firstName}
                          onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input 
                          id="lastName" 
                          value={newUserData.lastName}
                          onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="login">Логин</Label>
                        <Input 
                          id="login" 
                          value={newUserData.login}
                          onChange={(e) => setNewUserData({...newUserData, login: e.target.value})}
                          required 
                          placeholder="Введите логин" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Пароль</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                          required 
                          placeholder="Введите пароль" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email (опционально)</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                        placeholder="Если не указан, будет сгенерирован" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="telegramUsername">Telegram</Label>
                      <Input 
                        id="telegramUsername" 
                        value={newUserData.telegramUsername}
                        onChange={(e) => setNewUserData({...newUserData, telegramUsername: e.target.value})}
                        placeholder="@username" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Роль</Label>
                      <Select 
                        value={newUserData.role} 
                        onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Клиент</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="logist">Логист</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUserData.role === 'logist' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="location">Локация</Label>
                          <Input 
                            id="location" 
                            value={newUserData.location}
                            onChange={(e) => setNewUserData({...newUserData, location: e.target.value})}
                            placeholder="Город" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Адрес</Label>
                          <Input 
                            id="address" 
                            value={newUserData.address}
                            onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
                            placeholder="Полный адрес" 
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="supportsLockers" 
                              checked={newUserData.supportsLockers}
                              onChange={(e) => setNewUserData({...newUserData, supportsLockers: e.target.checked})}
                            />
                            <Label htmlFor="supportsLockers">Локеры</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="supportsOffices" 
                              checked={newUserData.supportsOffices}
                              onChange={(e) => setNewUserData({...newUserData, supportsOffices: e.target.checked})}
                            />
                            <Label htmlFor="supportsOffices">Каунтеры</Label>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateUser} 
                        disabled={createUserMutation.isPending || !newUserData.firstName || !newUserData.lastName || !newUserData.login || !newUserData.password || !newUserData.role} 
                        className="flex-1"
                      >
                        {createUserMutation.isPending ? "Создание..." : "Создать"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {usersLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredUsers?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Пользователи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers?.map((user: User) => (
            <UserCard
              key={user.id}
              user={user}
              onRoleChange={handleRoleChange}
              onAccessToggle={handleAccessToggle}
              onUpdateCredentials={handleUpdateCredentials}
              onDeleteUser={handleDeleteUser}
            />
          ))}
        </div>
      )}

      {/* Logists Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Логисты</h3>
        {logistsLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : logists?.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Логисты не найдены</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logists?.map((logist: any) => (
              <LogistCard key={logist.id} logist={logist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ user, onRoleChange, onAccessToggle, onUpdateCredentials, onDeleteUser }: {
  user: User;
  onRoleChange: (userId: string, role: string) => void;
  onAccessToggle: (userId: string, currentAccess: boolean) => void;
  onUpdateCredentials: (userId: string, login: string, password: string) => void;
  onDeleteUser: (userId: string) => void;
}) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'logist': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'logist': return 'Логист';
      case 'client': return 'Клиент';
      default: return role;
    }
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLogin, setEditLogin] = useState(user.login || '');
  const [editPassword, setEditPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSaveCredentials = () => {
    if (editLogin && editPassword) {
      onUpdateCredentials(user.id, editLogin, editPassword);
      setIsEditDialogOpen(false);
      setEditPassword('');
    }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDeleteUser(user.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

    const handleEditCredentials = () => {
        setIsEditDialogOpen(true);
        setEditLogin(user.login || '');
        setEditPassword('');
    };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {user.firstName || user.lastName ? 
                `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                user.email || 'Без имени'
              }
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">              {user.email}
            </p>
            {user.telegramUsername && (
              <p className="text-sm text-gray-600 mt-1">
                @{user.telegramUsername}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRoleColor(user.role)}>
              {getRoleText(user.role)}
            </Badge>
            {user.isActive ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select value={user.role} onValueChange={(value) => onRoleChange(user.id, value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="manager">Менеджер</SelectItem>
                <SelectItem value="logist">Логист</SelectItem>
                <SelectItem value="client">Клиент</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAccessToggle(user.id, user.isActive)}
            >
              {user.isActive ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
          </div>

          
          <div className="flex gap-2">
            <Button
              onClick={handleEditCredentials}
              variant="outline"
              size="sm"
            >
              Изменить данные
            </Button>
            <Button
              
              variant="outline"
              size="sm"
              onClick={() => onAccessToggle(user.id, user.isActive)}
            >
              {user.isActive ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteClick}
            >
              {confirmDelete ? "Подтвердить удаление" : "Удалить"}
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Создан: {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить данные пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLogin">Логин</Label>
              <Input
                id="editLogin"
                value={editLogin}
                onChange={(e) => setEditLogin(e.target.value)}
                placeholder="Введите новый логин"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassword">Пароль</Label>
              <Input
                id="editPassword"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Введите новый пароль"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCredentials} disabled={!editLogin || !editPassword}>
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function LogistCard({ logist }: { logist: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {logist.user.firstName || logist.user.lastName ? 
                `${logist.user.firstName || ''} ${logist.user.lastName || ''}`.trim() : 
                logist.user.email || 'Без имени'
              }
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {logist.user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {logist.isActive ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Локация:</p>
          <p className="text-sm text-gray-600">{logist.location}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Адрес:</p>
          <p className="text-sm text-gray-600">{logist.address}</p>
        </div>
        <div className="flex gap-2">
          {logist.supportsLockers && (
            <Badge variant="secondary">Локеры</Badge>
          )}
          {logist.supportsOffices && (
            <Badge variant="secondary">Каунтеры</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}