import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Package, User, Logist, Notification, PackageStatus } from "@/types";
import { getStatusDisplayName, canUserInteract, getStatusDescription } from "@/utils/statusUtils";
import { Package as PackageIcon, Users, MapPin, Bell, Plus, Edit, Trash2, Eye, UserPlus, Send, Settings, Shield, AlertTriangle, CheckCircle, RefreshCw, FileText, DollarSign, Clock, Truck, User as UserIcon, Mail, MessageCircle, Home } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("packages");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all data
  const { data: packages = [], refetch: refetchPackages } = useQuery<Package[]>({
    queryKey: ["/api/packages"]
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"]
  });

  const { data: logists = [] } = useQuery<Logist[]>({
    queryKey: ["/api/logists"]
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"]
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error("Ошибка создания пользователя");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Пользователь создан", description: "Новый пользователь успешно добавлен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Update package status mutation
  const updatePackageStatus = useMutation({
    mutationFn: async ({ packageId, status, comments }: { packageId: number; status: PackageStatus; comments?: string }) => {
      const response = await fetch(`/api/packages/${packageId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminComments: comments }),
      });
      if (!response.ok) throw new Error("Ошибка обновления статуса");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Статус обновлен", description: "Статус посылки успешно изменен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Delete package mutation  
  const deletePackage = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Ошибка удаления посылки");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Посылка удалена", description: "Посылка успешно удалена из системы" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Update user role mutation
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Ошибка обновления роли");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Роль обновлена", description: "Роль пользователя успешно изменена" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Toggle user access mutation
  const toggleUserAccess = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/users/${userId}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Ошибка обновления доступа");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Доступ обновлен", description: "Статус доступа пользователя изменен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Ошибка удаления пользователя");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Пользователь удален", description: "Пользователь успешно удален из системы" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Send notification mutation
  const sendNotification = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) throw new Error("Ошибка отправки уведомления");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Уведомление отправлено", description: "Уведомление успешно отправлено" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  // Filter packages
  const filteredPackages = packages.filter((pkg: Package) => {
    const matchesSearch = !searchTerm || 
      pkg.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === "all" || pkg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    refetchPackages();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/logists"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    toast({ title: "Обновлено", description: "Данные обновлены" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Панель администратора
              </h1>
              <p className="text-gray-600 mt-2">
                Полное управление системой пересылки посылок
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить всё
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего посылок</p>
                  <p className="text-3xl font-bold text-blue-700">{packages.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Активных: {packages.filter(p => !['paid_manager', 'shipped_client', 'completed', 'cancelled'].includes(p.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <PackageIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Пользователей</p>
                  <p className="text-3xl font-bold text-green-700">{users.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Активных: {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Логистов</p>
                  <p className="text-3xl font-bold text-purple-700">{logists.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Активных: {logists.filter(l => l.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-orange-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Уведомлений</p>
                  <p className="text-3xl font-bold text-orange-700">{notifications.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Непрочитанных: {notifications.filter(n => !n.isRead).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="packages">Посылки</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="logists">Логисты</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          {/* Packages Management */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Управление посылками</h2>
              <div className="text-sm text-gray-500">
                Всего: {filteredPackages.length} из {packages.length} посылок
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Поиск по номеру, товару, получателю или клиенту..."
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
                      <SelectItem value="created_client">Создана клиентом</SelectItem>
                      <SelectItem value="created_manager">Создана менеджером</SelectItem>
                      <SelectItem value="sent_to_logist_manager">Передана логисту</SelectItem>
                      <SelectItem value="received_info_logist">Получена логистом</SelectItem>
                      <SelectItem value="package_received_logist">Посылка получена</SelectItem>
                      <SelectItem value="awaiting_payment_client">Ожидает оплаты</SelectItem>
                      <SelectItem value="awaiting_shipping_logist">Ожидает отправки</SelectItem>
                      <SelectItem value="shipped_client">Отправлена</SelectItem>
                      <SelectItem value="paid_manager">Оплачена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredPackages.map((pkg) => (
                <AdminPackageCard 
                  key={pkg.id} 
                  package={pkg} 
                  onUpdateStatus={updatePackageStatus.mutate}
                  onDelete={deletePackage.mutate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Управление пользователями</h2>
              <CreateUserDialog onCreateUser={createUser.mutate} />
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <AdminUserCard 
                  key={user.id} 
                  user={user} 
                  onUpdateRole={updateUserRole.mutate}
                  onToggleAccess={toggleUserAccess.mutate}
                  onDelete={deleteUser.mutate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Logists Management */}
          <TabsContent value="logists" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Управление логистами</h2>
              <CreateLogistDialog />
            </div>

            <div className="grid gap-4">
              {logists.map((logist) => (
                <AdminLogistCard key={logist.id} logist={logist} />
              ))}
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Система уведомлений</h2>
              <SendNotificationDialog onSendNotification={sendNotification.mutate} />
            </div>

            <div className="grid gap-4">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsPanel packages={packages} users={users} logists={logists} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Admin Package Card Component
function AdminPackageCard({ 
  package: pkg, 
  onUpdateStatus, 
  onDelete 
}: { 
  package: Package; 
  onUpdateStatus: (data: { packageId: number; status: PackageStatus; comments?: string }) => void;
  onDelete: (packageId: number) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState("");
  const [showActions, setShowActions] = useState(false);

  const getNextActions = (status: PackageStatus) => {
    const actions: { label: string; status: PackageStatus; variant?: "default" | "destructive" }[] = [];

    switch (status) {
      case "created_client":
        actions.push({ label: "Создать менеджерскую версию", status: "created_manager" });
        break;
      case "created_manager":
        actions.push({ label: "Передать логисту", status: "sent_to_logist_manager" });
        break;
      case "sent_to_logist_manager":
        actions.push({ label: "Логист подтвердил", status: "logist_confirmed_manager" });
        break;
      case "logist_confirmed_manager":
        actions.push({ label: "Отправить информацию клиенту", status: "info_sent_to_client_manager" });
        break;
      case "info_sent_to_client_manager":
        actions.push({ label: "Клиент подтвердил", status: "confirmed_by_client_manager" });
        break;
      case "confirmed_by_client_manager":
        actions.push({ label: "Ожидает оплаты", status: "awaiting_payment_manager" });
        break;
      case "awaiting_payment_manager":
        actions.push({ label: "Оплата получена", status: "awaiting_processing_manager" });
        break;
      case "awaiting_processing_manager":
        actions.push({ label: "Готово к отправке", status: "awaiting_shipping_manager" });
        break;
      case "awaiting_shipping_manager":
        actions.push({ label: "Отправлена логистом", status: "shipped_by_logist_manager" });
        break;
      case "shipped_by_logist_manager":
        actions.push({ label: "Подтвердить доставку", status: "shipped_client" });
        break;
      case "received_info_logist":
        actions.push({ label: "Посылка получена", status: "package_received_logist" });
        break;
      case "package_received_logist":
        actions.push({ label: "Готово к отправке", status: "awaiting_shipping_logist" });
        break;
      case "awaiting_shipping_logist":
        actions.push({ label: "Отправлена", status: "shipped_logist" });
        break;
      case "shipped_logist":
        actions.push({ label: "Оплачена", status: "paid_logist" });
        break;
      default:
        break;
    }

    // Admin override options
    actions.push({ label: "Отменить посылку", status: "cancelled", variant: "destructive" });
    actions.push({ label: "Завершить обработку", status: "completed", variant: "destructive" });

    return actions;
  };

  const actions = getNextActions(pkg.status);

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{pkg.uniqueNumber}</div>
                <Badge className={`${getStatusColor(pkg.status)} text-xs`}>
                  {getStatusDisplayName(pkg.status)}
                </Badge>
              </div>
            </CardTitle>

            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{pkg.itemName}</span>
                <span className="text-gray-500">из {pkg.shopName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span>Клиент: {pkg.client?.firstName} {pkg.client?.lastName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Логист: {pkg.logist?.user?.firstName} {pkg.logist?.user?.lastName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Создана: {new Date(pkg.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="hover:bg-blue-50"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="hover:bg-green-50"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Вы уверены, что хотите удалить посылку ${pkg.uniqueNumber}?`)) {
                  onDelete(pkg.id);
                }
              }}
              className="hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {(showDetails || showActions) && (
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Telegram:</strong> {pkg.telegramUsername}</div>
                <div><strong>Получатель:</strong> {pkg.recipientName}</div>
                <div><strong>Трекинг:</strong> {pkg.trackingNumber}</div>
                <div><strong>Курьер:</strong> {pkg.courierService}</div>
                <div><strong>Тип доставки:</strong> {pkg.deliveryType}</div>
                {pkg.lockerAddress && (
                  <div><strong>Адрес локера:</strong> {pkg.lockerAddress}</div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">{getStatusDescription(pkg.status)}</p>
              </div>

              {pkg.adminComments && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-sm">Комментарии администратора:</strong>
                  <p className="text-sm mt-1">{pkg.adminComments}</p>
                </div>
              )}

              {pkg.comments && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <strong className="text-sm">Комментарии клиента:</strong>
                  <p className="text-sm mt-1">{pkg.comments}</p>
                </div>
              )}
            </div>
          )}

          {showActions && actions.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="admin-comments">Комментарии администратора</Label>
                <Textarea
                  id="admin-comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Добавьте комментарии для участников процесса..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {actions.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant || "default"}
                    size="sm"
                    onClick={() => {
                      onUpdateStatus({
                        packageId: pkg.id,
                        status: action.status,
                        comments: comments || undefined
                      });
                      setComments("");
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Admin User Card Component
function AdminUserCard({ 
  user, 
  onUpdateRole, 
  onToggleAccess, 
  onDelete 
}: { 
  user: User; 
  onUpdateRole: (data: { userId: string; role: string }) => void;
  onToggleAccess: (data: { userId: string; isActive: boolean }) => void;
  onDelete: (userId: string) => void;
}) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'logist': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'client': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'manager': return <Settings className="w-4 h-4" />;
      case 'logist': return <Truck className="w-4 h-4" />;
      case 'client': return <UserIcon className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
      user.isActive ? 'border-l-green-500 bg-gradient-to-r from-green-50/30 to-white' : 'border-l-red-500 bg-gradient-to-r from-red-50/30 to-white'
    }`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500">@{user.login}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{user.email}</span>
              </div>

              {user.telegramUsername && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span>Telegram: {user.telegramUsername}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Создан: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Badge className={getRoleColor(user.role)} variant="outline">
                {user.role === 'admin' ? 'Администратор' : 
                 user.role === 'manager' ? 'Менеджер' :
                 user.role === 'logist' ? 'Логист' : 'Клиент'}
              </Badge>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "Активен" : "Заблокирован"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Роль</Label>
                <Select
                  value={user.role}
                  onValueChange={(value) => onUpdateRole({ userId: user.id, role: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Клиент</SelectItem>
                    <SelectItem value="logist">Логист</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={user.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggleAccess({ userId: user.id, isActive: !user.isActive })}
                  className="flex-1"
                >
                  {user.isActive ? "Блокировать" : "Разблокировать"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?`)) {
                      onDelete(user.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create User Dialog Component
function CreateUserDialog({ onCreateUser }: { onCreateUser: (user: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "client" as "admin" | "manager" | "logist" | "client",
    telegramUsername: "",
    location: "",
    address: "",
    supportsLockers: false,
    supportsOffices: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateUser(formData);
    setFormData({
      login: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "client",
      telegramUsername: "",
      location: "",
      address: "",
      supportsLockers: false,
      supportsOffices: false
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Создать пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового пользователя</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                value={formData.login}
                onChange={(e) => setFormData({...formData, login: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Роль</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Клиент</SelectItem>
                <SelectItem value="logist">Логист</SelectItem>
                <SelectItem value="manager">Менеджер</SelectItem>
                <SelectItem value="admin">Администратор</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="telegramUsername">Telegram Username</Label>
            <Input
              id="telegramUsername"
              value={formData.telegramUsername}
              onChange={(e) => setFormData({...formData, telegramUsername: e.target.value})}
              placeholder="@username"
            />
          </div>

          {formData.role === "logist" && (
            <>
              <div>
                <Label htmlFor="location">Местоположение</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Город"
                />
              </div>
              <div>
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Полный адрес"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.supportsLockers}
                    onChange={(e) => setFormData({...formData, supportsLockers: e.target.checked})}
                  />
                  <span>Поддерживает локеры</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.supportsOffices}
                    onChange={(e) => setFormData({...formData, supportsOffices: e.target.checked})}
                  />
                  <span>Поддерживает офисы</span>
                </label>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">Создать</Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Admin Logist Card Component
function AdminLogistCard({ logist }: { logist: Logist }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {logist.location}
            </h3>
            <p className="text-sm text-gray-600">{logist.address}</p>
            {logist.user && (
              <p className="text-sm text-gray-600 mt-1">
                {logist.user.firstName} {logist.user.lastName} (@{logist.user.login})
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {logist.supportsLockers && (
                <Badge variant="outline">Локеры</Badge>
              )}
              {logist.supportsOffices && (
                <Badge variant="outline">Офисы</Badge>
              )}
            </div>
          </div>
          <Badge variant={logist.isActive ? "default" : "secondary"}>
            {logist.isActive ? "Активен" : "Неактивен"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Logist Dialog Component
function CreateLogistDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Создать логиста
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создание нового логиста</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Логисты создаются автоматически при создании пользователя с ролью "Логист"
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Send Notification Dialog Component
function SendNotificationDialog({ onSendNotification }: { onSendNotification: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipients: "all",
    title: "",
    message: "",
    type: "system"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendNotification(formData);
    setFormData({
      recipients: "all",
      title: "",
      message: "",
      type: "system"
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="w-4 h-4 mr-2" />
          Отправить уведомление
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправка уведомления</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recipients">Получатели</Label>
            <Select value={formData.recipients} onValueChange={(value) => setFormData({...formData, recipients: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                <SelectItem value="clients">Все клиенты</SelectItem>
                <SelectItem value="logists">Все логисты</SelectItem>
                <SelectItem value="managers">Все менеджеры</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Отправить</Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Notification Card Component
function NotificationCard({ notification }: { notification: Notification }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 mt-0.5 text-blue-500" />
            <div>
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="text-sm text-gray-600">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={notification.type === "system" ? "default" : "secondary"}>
              {notification.type}
            </Badge>
            <Badge variant={notification.isRead ? "secondary" : "destructive"}>
              {notification.isRead ? "Прочитано" : "Новое"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Analytics Panel Component
function AnalyticsPanel({ packages, users, logists }: { 
  packages: Package[]; 
  users: User[]; 
  logists: Logist[]; 
}) {
  const totalPackages = packages.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const activeLogists = logists.filter(l => l.isActive).length;

  const packagesByStatus = packages.reduce((acc, pkg) => {
    acc[pkg.status] = (acc[pkg.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Аналитика системы</h2>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <PackageIcon className="h-8 w-8 text-blue-600" />
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
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{activeUsers}</div>
                <p className="text-sm text-gray-600">Активных пользователей</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{activeLogists}</div>
                <p className="text-sm text-gray-600">Активных логистов</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение посылок по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(packagesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium">{getStatusDisplayName(status)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / totalPackages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение пользователей по ролям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{role}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(count / users.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: string): string {
  if (status.includes('created')) return 'bg-blue-100 text-blue-800';
  if (status.includes('awaiting')) return 'bg-yellow-100 text-yellow-800';
  if (status.includes('shipped') || status.includes('paid')) return 'bg-green-100 text-green-800';
  if (status.includes('confirmed')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}