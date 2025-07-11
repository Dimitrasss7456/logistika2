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
import { useUsers, useUpdateUserRole, useToggleUserAccess, useLogists } from "@/hooks/useUsers";
import { Package as PackageType, User } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Edit, UserCheck, UserX } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

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
          window.location.href = "/api/login";
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
      'created_admin': 'Создана',
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
      'created_admin': 'bg-blue-100 text-blue-800',
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
                      <SelectItem value="created_admin">Создана</SelectItem>
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
            <Card>
              <CardHeader>
                <CardTitle>Аналитика</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Функция аналитики будет добавлена позже</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки системы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Функция настроек будет добавлена позже</p>
              </CardContent>
            </Card>
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
                <SelectItem value="created_admin">Создана</SelectItem>
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

function UserManagement() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{login: string, password: string} | null>(null);

  const { data: users, isLoading: usersLoading } = useUsers(selectedRole === 'all' ? undefined : selectedRole);
  const { data: logists, isLoading: logistsLoading } = useLogists();
  const updateUserRole = useUpdateUserRole();
  const toggleUserAccess = useToggleUserAccess();
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

  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setGeneratedCredentials(data.credentials);
      toast({
        title: "Пользователь создан",
        description: "Логин и пароль сгенерированы успешно",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      telegramUsername: formData.get('telegramUsername'),
      role: formData.get('role'),
      location: formData.get('location'),
      address: formData.get('address'),
      supportsLockers: formData.get('supportsLockers') === 'on',
      supportsOffices: formData.get('supportsOffices') === 'on',
    };
    createUser.mutate(userData);
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
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Имя</Label>
                        <Input id="firstName" name="firstName" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input id="lastName" name="lastName" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email (опционально)</Label>
                      <Input id="email" name="email" type="email" placeholder="Если не указан, будет сгенерирован" />
                    </div>
                    <div>
                      <Label htmlFor="telegramUsername">Telegram</Label>
                      <Input id="telegramUsername" name="telegramUsername" placeholder="@username" />
                    </div>
                    <div>
                      <Label htmlFor="role">Роль</Label>
                      <Select name="role" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Клиент</SelectItem>
                          <SelectItem value="logist">Логист</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div id="logist-fields" className="space-y-4">
                      <div>
                        <Label htmlFor="location">Локация (для логистов)</Label>
                        <Input id="location" name="location" placeholder="Город" />
                      </div>
                      <div>
                        <Label htmlFor="address">Адрес (для логистов)</Label>
                        <Input id="address" name="address" placeholder="Полный адрес" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="supportsLockers" name="supportsLockers" />
                          <Label htmlFor="supportsLockers">Локеры</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="supportsOffices" name="supportsOffices" />
                          <Label htmlFor="supportsOffices">Офисы</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createUser.isPending} className="flex-1">
                        {createUser.isPending ? "Создание..." : "Создать"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Отмена
                      </Button>
                    </div>
                  </form>
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

function UserCard({ user, onRoleChange, onAccessToggle }: {
  user: User;
  onRoleChange: (userId: string, role: string) => void;
  onAccessToggle: (userId: string, currentAccess: boolean) => void;
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
            <p className="text-sm text-gray-600 mt-1">
              {user.email}
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
        <div className="text-xs text-gray-500">
          Создан: {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
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
            <Badge variant="secondary">Офисы</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}