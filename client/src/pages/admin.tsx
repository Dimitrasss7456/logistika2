import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Users, Settings, BarChart3 } from "lucide-react";
import { usePackages, useUpdatePackageStatus } from "@/hooks/usePackages";
import { Package as PackageType } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Функция управления пользователями будет добавлена позже</p>
              </CardContent>
            </Card>
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
