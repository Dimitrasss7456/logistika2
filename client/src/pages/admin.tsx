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
import { Package as PackageIcon, Users, MapPin, Bell, Plus, Edit, Trash2, Eye } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();

  // Fetch all data
  const { data: packages = [] } = useQuery<Package[]>({
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
      const response = await fetch(`/api/admin/packages/${packageId}`, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PackageIcon className="w-8 h-8" />
            Панель администратора
          </h1>
          <p className="text-gray-600 mt-2">
            Управление всеми аспектами системы пересылки посылок
          </p>
        </div>

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="packages">Посылки</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="logists">Логисты</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          </TabsList>

          {/* Packages Management */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Управление посылками</h2>
              <div className="text-sm text-gray-500">
                Всего: {packages.length} посылок
              </div>
            </div>

            <div className="grid gap-4">
              {packages.map((pkg) => (
                <PackageCard 
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
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </TabsContent>

          {/* Logists Management */}
          <TabsContent value="logists" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Управление логистами</h2>
            </div>

            <div className="grid gap-4">
              {logists.map((logist) => (
                <LogistCard key={logist.id} logist={logist} />
              ))}
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Система уведомлений</h2>
            </div>

            <div className="grid gap-4">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Package Card Component with full TZ workflow management
function PackageCard({ 
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

  const getNextActions = (status: PackageStatus) => {
    const actions: { label: string; status: PackageStatus; variant?: "default" | "destructive" }[] = [];
    
    switch (status) {
      case "created_manager":
        actions.push({ label: "Передать логисту", status: "sent_to_logist_manager" });
        break;
      case "logist_confirmed_manager":
        actions.push({ label: "Отправить информацию клиенту", status: "info_sent_to_client_manager" });
        break;
      case "confirmed_by_client_manager":
        actions.push({ label: "Отправить данные об оплате", status: "awaiting_payment_manager" });
        break;
      case "awaiting_processing_manager":
        actions.push({ label: "Отправить на доставку", status: "awaiting_shipping_manager" });
        break;
      case "shipped_by_logist_manager":
        actions.push({ label: "Подтвердить доставку клиенту", status: "shipped_client" });
        break;
      default:
        break;
    }

    // Manual payment option for any manager status
    if (status.includes("manager")) {
      actions.push({ label: "Оплачено вручную", status: "paid_manager", variant: "destructive" });
    }

    return actions;
  };

  const actions = getNextActions(pkg.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {pkg.uniqueNumber}
              <Badge className={getStatusColor(pkg.status)}>
                {getStatusDisplayName(pkg.status)}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {pkg.itemName} из {pkg.shopName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(pkg.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Клиент:</strong> {pkg.client?.firstName} {pkg.client?.lastName}
            </div>
            <div>
              <strong>Telegram:</strong> {pkg.telegramUsername}
            </div>
            <div>
              <strong>Получатель:</strong> {pkg.recipientName}
            </div>
            <div>
              <strong>Трекинг:</strong> {pkg.trackingNumber}
            </div>
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

          {actions.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="comments">Комментарии (необязательно)</Label>
                <Textarea
                  id="comments"
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

// User Management Components
function CreateUserDialog({ onCreateUser }: { onCreateUser: (user: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "client" as "admin" | "manager" | "logist" | "client",
    telegramUsername: ""
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
      telegramUsername: ""
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Создать пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создание нового пользователя</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
            <p className="text-sm text-gray-600">@{user.login}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.telegramUsername && (
              <p className="text-sm text-gray-600">{user.telegramUsername}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.role === "admin" ? "destructive" : "default"}>
              {user.role}
            </Badge>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Активен" : "Неактивен"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LogistCard({ logist }: { logist: Logist }) {
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

function getStatusColor(status: string): string {
  if (status.includes('created')) return 'bg-blue-100 text-blue-800';
  if (status.includes('awaiting')) return 'bg-yellow-100 text-yellow-800';
  if (status.includes('shipped') || status.includes('paid')) return 'bg-green-100 text-green-800';
  if (status.includes('confirmed')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}