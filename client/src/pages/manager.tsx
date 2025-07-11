import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, useUpdatePackageStatus } from "@/hooks/usePackages";
import { useUsers, useUpdateUserRole, useToggleUserAccess } from "@/hooks/useUsers";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, User, Settings, Shield, Bell, FileText, Send, Edit, UserPlus, MessageSquare, CheckCircle, DollarSign, Upload, Eye } from "lucide-react";
import { Package as PackageType, User as UserType } from "@/types";

export default function Manager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (user && user.role !== 'manager') {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);
  
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("packages");
  
  const updatePackageStatus = useUpdatePackageStatus();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизованный доступ",
        description: "Вы не авторизованы. Выполняется вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: packages, isLoading: packagesLoading, error: packagesError } = usePackages({
    search: searchTerm,
    status: statusFilter || undefined,
  });

  const { data: users, isLoading: usersLoading } = useUsers();

  // Handle authentication errors
  useEffect(() => {
    if (packagesError && isUnauthorizedError(packagesError)) {
      toast({
        title: "Сессия истекла",
        description: "Пожалуйста, войдите снова",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [packagesError, toast]);

  const handleStatusUpdate = (id: number, newStatus: string, adminComments?: string) => {
    updatePackageStatus.mutate({
      id,
      status: newStatus,
      adminComments,
    });
  };

  // Manager-specific status actions
  const getRequiredActionForStatus = (status: string) => {
    switch (status) {
      case "created":
        return "Проверить информацию от клиента и отправить логисту";
      case "logist_confirmed":
        return "Проверить данные от логиста и отправить информацию клиенту";
      case "confirmed_by_client":
        return "Сформировать сумму для оплаты";
      case "awaiting_processing":
        return "Отправить файлы логисту";
      case "shipped":
        return "Проверить и изменить статус клиенту";
      case "paid":
        return "Добавить в оплачено";
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      created: "bg-blue-100 text-blue-800",
      sent_to_logist: "bg-yellow-100 text-yellow-800",
      received_by_logist: "bg-purple-100 text-purple-800",
      logist_confirmed: "bg-green-100 text-green-800",
      info_sent_to_client: "bg-indigo-100 text-indigo-800",
      confirmed_by_client: "bg-orange-100 text-orange-800",
      awaiting_payment: "bg-red-100 text-red-800",
      awaiting_processing: "bg-pink-100 text-pink-800",
      awaiting_shipping: "bg-cyan-100 text-cyan-800",
      shipped: "bg-emerald-100 text-emerald-800",
      paid: "bg-green-100 text-green-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      created: "Создана",
      sent_to_logist: "Передана логисту",
      received_by_logist: "Получена логистом",
      logist_confirmed: "Логист подтвердил получение",
      info_sent_to_client: "Передана информация клиенту",
      confirmed_by_client: "Подтверждена клиентом",
      awaiting_payment: "Ожидает оплаты",
      awaiting_processing: "Ожидает обработки",
      awaiting_shipping: "Ожидает отправки",
      shipped: "Отправлена",
      paid: "Оплачена",
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель менеджера
          </h1>
          <p className="text-gray-600">
            Управление посылками, пользователями и уведомлениями
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="packages">Посылки</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="mt-6">
            <div className="space-y-6">
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
                        <SelectItem value="received_by_logist">Получена логистом</SelectItem>
                        <SelectItem value="logist_confirmed">Логист подтвердил</SelectItem>
                        <SelectItem value="info_sent_to_client">Передана клиенту</SelectItem>
                        <SelectItem value="confirmed_by_client">Подтверждена клиентом</SelectItem>
                        <SelectItem value="awaiting_payment">Ожидает оплаты</SelectItem>
                        <SelectItem value="awaiting_processing">Ожидает обработки</SelectItem>
                        <SelectItem value="awaiting_shipping">Ожидает отправки</SelectItem>
                        <SelectItem value="shipped">Отправлена</SelectItem>
                        <SelectItem value="paid">Оплачена</SelectItem>
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
                  {packages?.map((pkg: PackageType) => (
                    <ManagerPackageCard
                      key={pkg.id}
                      package={pkg}
                      onStatusUpdate={handleStatusUpdate}
                      onEdit={() => setSelectedPackageId(pkg.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ManagerPackageCard({ package: pkg, onStatusUpdate, onEdit }: {
  package: PackageType;
  onStatusUpdate: (id: number, status: string, comments?: string) => void;
  onEdit: () => void;
}) {
  const [comments, setComments] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const requiredAction = getRequiredActionForStatus(pkg.status);
  
  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(pkg.id, newStatus, comments);
    setComments("");
  };

  const getRequiredActionForStatus = (status: string) => {
    switch (status) {
      case "created":
        return "Проверить информацию от клиента и отправить логисту";
      case "logist_confirmed":
        return "Проверить данные от логиста и отправить информацию клиенту";
      case "confirmed_by_client":
        return "Сформировать сумму для оплаты";
      case "awaiting_processing":
        return "Отправить файлы логисту";
      case "shipped":
        return "Проверить и изменить статус клиенту";
      case "paid":
        return "Добавить в оплачено";
      default:
        return null;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "created":
        return "sent_to_logist";
      case "logist_confirmed":
        return "info_sent_to_client";
      case "confirmed_by_client":
        return "awaiting_payment";
      case "awaiting_processing":
        return "awaiting_shipping";
      case "shipped":
        return "paid";
      default:
        return currentStatus;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">#{pkg.uniqueNumber}</CardTitle>
            <Badge className={getStatusColor(pkg.status)}>
              {getStatusText(pkg.status)}
            </Badge>
            {requiredAction && (
              <Badge variant="destructive">
                Требуется действие
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Клиент:</span> {pkg.client?.firstName} {pkg.client?.lastName}
            </div>
            <div>
              <span className="font-medium">Логист:</span> {pkg.logist?.user?.firstName} {pkg.logist?.user?.lastName}
            </div>
            <div>
              <span className="font-medium">Товар:</span> {pkg.itemName}
            </div>
            <div>
              <span className="font-medium">Получатель:</span> {pkg.recipientName}
            </div>
          </div>

          {showDetails && (
            <div className="pt-4 border-t space-y-2 text-sm">
              <div><span className="font-medium">Трекинг:</span> {pkg.trackingNumber}</div>
              <div><span className="font-medium">Курьер:</span> {pkg.courierService}</div>
              <div><span className="font-medium">Магазин:</span> {pkg.shopName}</div>
              <div><span className="font-medium">Telegram:</span> {pkg.telegramUsername}</div>
              {pkg.comments && (
                <div><span className="font-medium">Комментарии:</span> {pkg.comments}</div>
              )}
            </div>
          )}

          {requiredAction && (
            <div className="pt-4 border-t">
              <div className="mb-3">
                <p className="text-sm font-medium text-orange-600 mb-2">
                  Требуемое действие: {requiredAction}
                </p>
                <Textarea
                  placeholder="Комментарии администратора..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mb-3"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusChange(getNextStatus(pkg.status))}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Выполнить действие
                </Button>
                {pkg.status === "confirmed_by_client" && (
                  <Button
                    onClick={() => handleStatusChange("awaiting_payment")}
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Отправить на оплату
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserManagement() {
  const { data: users, isLoading } = useUsers();
  const updateUserRole = useUpdateUserRole();
  const toggleUserAccess = useToggleUserAccess();
  const { toast } = useToast();

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handleAccessToggle = (userId: string, isActive: boolean) => {
    toggleUserAccess.mutate({ userId, isActive });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user: UserType) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Клиент</SelectItem>
                      <SelectItem value="logist">Логист</SelectItem>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="admin">Админ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={user.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleAccessToggle(user.id, !user.isActive)}
                  >
                    {user.isActive ? "Заблокировать" : "Разблокировать"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationCenter() {
  const [recipients, setRecipients] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSendNotification = () => {
    // Here you would implement the notification sending logic
    toast({
      title: "Уведомление отправлено",
      description: `Сообщение отправлено для: ${recipients}`,
    });
    setTitle("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Отправить уведомление</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipients">Получатели</Label>
              <Select value={recipients} onValueChange={setRecipients}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="clients">Все клиенты</SelectItem>
                  <SelectItem value="logists">Все логисты</SelectItem>
                  <SelectItem value="specific">Конкретный пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Заголовок уведомления"
              />
            </div>
            <div>
              <Label htmlFor="message">Сообщение</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Текст уведомления"
                rows={4}
              />
            </div>
            <Button onClick={handleSendNotification} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Отправить уведомление
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">45</div>
            <p className="text-sm text-gray-600">Активных посылок</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-gray-600">Требует действий</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">123</div>
            <p className="text-sm text-gray-600">Общее количество</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">87%</div>
            <p className="text-sm text-gray-600">Успешных доставок</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colorMap: { [key: string]: string } = {
    created: "bg-blue-100 text-blue-800",
    sent_to_logist: "bg-yellow-100 text-yellow-800",
    received_by_logist: "bg-purple-100 text-purple-800",
    logist_confirmed: "bg-green-100 text-green-800",
    info_sent_to_client: "bg-indigo-100 text-indigo-800",
    confirmed_by_client: "bg-orange-100 text-orange-800",
    awaiting_payment: "bg-red-100 text-red-800",
    awaiting_processing: "bg-pink-100 text-pink-800",
    awaiting_shipping: "bg-cyan-100 text-cyan-800",
    shipped: "bg-emerald-100 text-emerald-800",
    paid: "bg-green-100 text-green-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
}

function getStatusText(status: string) {
  const statusMap: { [key: string]: string } = {
    created: "Создана",
    sent_to_logist: "Передана логисту",
    received_by_logist: "Получена логистом",
    logist_confirmed: "Логист подтвердил получение",
    info_sent_to_client: "Передана информация клиенту",
    confirmed_by_client: "Подтверждена клиентом",
    awaiting_payment: "Ожидает оплаты",
    awaiting_processing: "Ожидает обработки",
    awaiting_shipping: "Ожидает отправки",
    shipped: "Отправлена",
    paid: "Оплачена",
  };
  return statusMap[status] || status;
}