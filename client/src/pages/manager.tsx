
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
import { Package, User, Settings, Shield, Bell, FileText, Send, Edit, UserPlus, MessageSquare, CheckCircle, DollarSign, Upload, Eye, Truck, Clock, AlertTriangle, RefreshCw } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Fetch packages without status filtering - let manager see all packages
  const { data: packages, isLoading: packagesLoading, error: packagesError, refetch: refetchPackages } = usePackages({
    search: searchTerm || undefined,
    // Don't pass status filter to API - filter locally instead
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
    }, {
      onSuccess: () => {
        toast({
          title: "Статус обновлен",
          description: "Статус посылки успешно изменен",
        });
        // Force refresh packages
        refetchPackages();
      },
      onError: () => {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус",
          variant: "destructive",
        });
      }
    });
  };

  const handleRefresh = () => {
    refetchPackages();
    toast({
      title: "Обновление",
      description: "Список посылок обновлен",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter packages after fetching
  const filteredPackages = packages?.filter((pkg: PackageType) => {
    const matchesSearch = !searchTerm || 
      pkg.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Панель менеджера
              </h1>
              <p className="text-gray-600">
                Управление посылками, пользователями и уведомлениями
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="packages">
              <Package className="h-4 w-4 mr-2" />
              Посылки ({filteredPackages.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Settings className="h-4 w-4 mr-2" />
              Аналитика
            </TabsTrigger>
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
                        className="max-w-md"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="created">Создана</SelectItem>
                        <SelectItem value="created_client">Создана клиентом</SelectItem>
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

              {/* Debug Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-sm space-y-2">
                    <div><strong>Всего посылок из API:</strong> {packages?.length || 0}</div>
                    <div><strong>После фильтрации:</strong> {filteredPackages.length}</div>
                    <div><strong>Загрузка:</strong> {packagesLoading ? 'Да' : 'Нет'}</div>
                    <div><strong>Ошибка:</strong> {packagesError?.message || 'Нет'}</div>
                    <div><strong>Поисковый запрос:</strong> "{searchTerm}"</div>
                    <div><strong>Фильтр статуса:</strong> "{statusFilter || 'не выбран'}"</div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Всего посылок</p>
                        <p className="text-2xl font-bold">{filteredPackages.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Требует действий</p>
                        <p className="text-2xl font-bold">
                          {filteredPackages.filter(pkg => ['created', 'logist_confirmed', 'confirmed_by_client', 'awaiting_processing', 'shipped'].includes(pkg.status)).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Truck className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">В пути</p>
                        <p className="text-2xl font-bold">
                          {filteredPackages.filter(pkg => ['sent_to_logist', 'received_by_logist', 'awaiting_shipping'].includes(pkg.status)).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Завершено</p>
                        <p className="text-2xl font-bold">
                          {filteredPackages.filter(pkg => pkg.status === 'paid').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Packages List */}
              {packagesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredPackages.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {packages?.length === 0 ? 'Посылки не найдены' : 'Нет посылок по выбранным фильтрам'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {packages?.length === 0 
                        ? 'Пока нет посылок для управления' 
                        : 'Попробуйте изменить фильтры поиска'}
                    </p>
                    {packages?.length === 0 && (
                      <Button onClick={handleRefresh} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Обновить список
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPackages.map((pkg: PackageType) => (
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
            <AnalyticsPanel packages={filteredPackages} />
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
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      created: "bg-blue-100 text-blue-800 border-blue-200",
      created_client: "bg-blue-100 text-blue-800 border-blue-200",
      sent_to_logist: "bg-yellow-100 text-yellow-800 border-yellow-200",
      received_by_logist: "bg-purple-100 text-purple-800 border-purple-200",
      logist_confirmed: "bg-green-100 text-green-800 border-green-200",
      info_sent_to_client: "bg-indigo-100 text-indigo-800 border-indigo-200",
      confirmed_by_client: "bg-orange-100 text-orange-800 border-orange-200",
      awaiting_payment: "bg-red-100 text-red-800 border-red-200",
      awaiting_processing: "bg-pink-100 text-pink-800 border-pink-200",
      awaiting_shipping: "bg-cyan-100 text-cyan-800 border-cyan-200",
      shipped: "bg-emerald-100 text-emerald-800 border-emerald-200",
      paid: "bg-green-100 text-green-800 border-green-200",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      created: "Создана",
      created_client: "Создана клиентом",
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

  const getRequiredAction = (status: string) => {
    switch (status) {
      case "created":
      case "created_client":
        return { text: "Проверить информацию от клиента и отправить логисту", nextStatus: "sent_to_logist", color: "text-blue-600" };
      case "logist_confirmed":
        return { text: "Проверить данные от логиста и отправить информацию клиенту", nextStatus: "info_sent_to_client", color: "text-green-600" };
      case "confirmed_by_client":
        return { text: "Сформировать сумму для оплаты", nextStatus: "awaiting_payment", color: "text-orange-600" };
      case "awaiting_processing":
        return { text: "Отправить файлы логисту", nextStatus: "awaiting_shipping", color: "text-pink-600" };
      case "shipped":
        return { text: "Проверить и изменить статус клиенту", nextStatus: "paid", color: "text-emerald-600" };
      default:
        return null;
    }
  };

  const requiredAction = getRequiredAction(pkg.status);

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(pkg.id, newStatus, comments);
    setComments("");
    setActionModalOpen(false);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">#{pkg.uniqueNumber}</CardTitle>
            </div>
            <Badge className={`${getStatusColor(pkg.status)} border`}>
              {getStatusText(pkg.status)}
            </Badge>
            {requiredAction && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
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
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Клиент:</span> 
              <span>{pkg.client?.firstName} {pkg.client?.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Логист:</span> 
              <span>{pkg.logist?.user?.firstName} {pkg.logist?.user?.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Товар:</span> 
              <span>{pkg.itemName}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Получатель:</span> 
              <span>{pkg.recipientName}</span>
            </div>
          </div>

          {/* Detailed Info */}
          {showDetails && (
            <div className="pt-4 border-t space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Трекинг:</span> {pkg.trackingNumber}</div>
                <div><span className="font-medium">Курьер:</span> {pkg.courierService}</div>
                <div><span className="font-medium">Магазин:</span> {pkg.shopName}</div>
                <div><span className="font-medium">Telegram:</span> {pkg.telegramUsername}</div>
                <div><span className="font-medium">Тип доставки:</span> {pkg.deliveryType}</div>
                {pkg.lockerAddress && (
                  <div><span className="font-medium">Адрес:</span> {pkg.lockerAddress}</div>
                )}
              </div>
              {pkg.comments && (
                <div className="pt-2 border-t">
                  <span className="font-medium">Комментарии:</span> 
                  <p className="mt-1 text-gray-600">{pkg.comments}</p>
                </div>
              )}
              {pkg.adminComments && (
                <div className="pt-2 border-t">
                  <span className="font-medium">Комментарии администратора:</span> 
                  <p className="mt-1 text-gray-600">{pkg.adminComments}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Section */}
          {requiredAction && (
            <div className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 ${requiredAction.color} mt-1 flex-shrink-0`} />
                <div className="flex-1">
                  <p className={`font-medium ${requiredAction.color} mb-3`}>
                    {requiredAction.text}
                  </p>
                  <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Выполнить действие
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Выполнить действие для посылки #{pkg.uniqueNumber}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="action-description">Действие</Label>
                          <p className="text-sm text-gray-600 mt-1">{requiredAction.text}</p>
                        </div>
                        <div>
                          <Label htmlFor="comments">Комментарии (необязательно)</Label>
                          <Textarea
                            id="comments"
                            placeholder="Добавьте комментарии к действию..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStatusChange(requiredAction.nextStatus)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Подтвердить
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActionModalOpen(false)}
                            className="flex-1"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
    updateUserRole.mutate({ userId, role: newRole }, {
      onSuccess: () => {
        toast({
          title: "Роль обновлена",
          description: "Роль пользователя успешно изменена",
        });
      }
    });
  };

  const handleAccessToggle = (userId: string, isActive: boolean) => {
    toggleUserAccess.mutate({ userId, isActive }, {
      onSuccess: () => {
        toast({
          title: "Доступ обновлен",
          description: `Пользователь ${isActive ? 'разблокирован' : 'заблокирован'}`,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user: UserType) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Активен" : "Заблокирован"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  {user.telegramUsername && (
                    <div className="text-sm text-gray-500">Telegram: {user.telegramUsername}</div>
                  )}
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
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправить уведомление
          </CardTitle>
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

function AnalyticsPanel({ packages }: { packages?: PackageType[] }) {
  const totalPackages = packages?.length || 0;
  const requiresAction = packages?.filter(pkg => 
    ['created', 'logist_confirmed', 'confirmed_by_client', 'awaiting_processing', 'shipped'].includes(pkg.status)
  ).length || 0;
  const inTransit = packages?.filter(pkg => 
    ['sent_to_logist', 'received_by_logist', 'awaiting_shipping'].includes(pkg.status)
  ).length || 0;
  const completed = packages?.filter(pkg => pkg.status === 'paid').length || 0;
  const successRate = totalPackages > 0 ? Math.round((completed / totalPackages) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{totalPackages}</div>
                <p className="text-sm text-gray-600">Всего посылок</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{requiresAction}</div>
                <p className="text-sm text-gray-600">Требует действий</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{inTransit}</div>
                <p className="text-sm text-gray-600">В пути</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-sm text-gray-600">Успешных доставок</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Распределение по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packages?.reduce((acc, pkg) => {
              acc[pkg.status] = (acc[pkg.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) && 
              Object.entries(packages.reduce((acc, pkg) => {
                acc[pkg.status] = (acc[pkg.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / totalPackages) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
