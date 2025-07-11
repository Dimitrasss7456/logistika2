import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Send, CheckCircle, FileText, CreditCard, Truck } from "lucide-react";
import { usePackages, useUpdatePackageStatus } from "@/hooks/usePackages";
import { Package as PackageType } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import PackageMessages from "@/components/messages/package-messages";

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

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      created_manager: "Создана",
      sent_to_logist: "Передана логисту",
      logist_confirmed: "Логист подтвердил получение",
      info_sent_to_client: "Передана информация клиенту",
      confirmed_by_client: "Подтверждена клиентом",
      awaiting_payment_manager: "Ожидает оплаты",
      awaiting_processing_manager: "Ожидает обработки",
      awaiting_shipping_manager: "Ожидает отправки",
      sent_by_logist: "Отправлена логистом",
      paid_manager: "Оплачена",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      created_manager: "bg-blue-100 text-blue-800",
      sent_to_logist: "bg-yellow-100 text-yellow-800",
      logist_confirmed: "bg-green-100 text-green-800",
      info_sent_to_client: "bg-purple-100 text-purple-800",
      confirmed_by_client: "bg-indigo-100 text-indigo-800",
      awaiting_payment_manager: "bg-orange-100 text-orange-800",
      awaiting_processing_manager: "bg-red-100 text-red-800",
      awaiting_shipping_manager: "bg-pink-100 text-pink-800",
      sent_by_logist: "bg-emerald-100 text-emerald-800",
      paid_manager: "bg-green-100 text-green-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Filter packages to show only those relevant to manager
  const managerPackages = packages?.filter((pkg) => 
    ['created_manager', 'sent_to_logist', 'logist_confirmed', 'info_sent_to_client', 
     'confirmed_by_client', 'awaiting_payment_manager', 'awaiting_processing_manager', 
     'awaiting_shipping_manager', 'sent_by_logist', 'paid_manager'].includes(pkg.status)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель менеджера
          </h1>
          <p className="text-gray-600">
            Управление обработкой и координацией посылок
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
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
                  <SelectItem value="">Все статусы</SelectItem>
                  <SelectItem value="created_manager">Создана</SelectItem>
                  <SelectItem value="sent_to_logist">Передана логисту</SelectItem>
                  <SelectItem value="logist_confirmed">Логист подтвердил</SelectItem>
                  <SelectItem value="info_sent_to_client">Передана клиенту</SelectItem>
                  <SelectItem value="confirmed_by_client">Подтверждена клиентом</SelectItem>
                  <SelectItem value="awaiting_payment_manager">Ожидает оплаты</SelectItem>
                  <SelectItem value="awaiting_processing_manager">Ожидает обработки</SelectItem>
                  <SelectItem value="awaiting_shipping_manager">Ожидает отправки</SelectItem>
                  <SelectItem value="sent_by_logist">Отправлена логистом</SelectItem>
                  <SelectItem value="paid_manager">Оплачена</SelectItem>
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
        ) : managerPackages?.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Посылки не найдены</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {managerPackages?.map((pkg) => (
              <ManagerPackageCard
                key={pkg.id}
                package={pkg}
                onStatusUpdate={handleStatusUpdate}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
                onOpenMessages={() => setSelectedPackageId(pkg.id)}
              />
            ))}
          </div>
        )}

        {/* Package Messages Modal */}
        {selectedPackageId && (
          <PackageMessages
            packageId={selectedPackageId}
            open={!!selectedPackageId}
            onOpenChange={(open) => !open && setSelectedPackageId(null)}
          />
        )}
      </div>
    </div>
  );
}

function ManagerPackageCard({
  package: pkg,
  onStatusUpdate,
  getStatusText,
  getStatusColor,
  onOpenMessages,
}: {
  package: PackageType;
  onStatusUpdate: (id: number, status: string, comments?: string) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  onOpenMessages: () => void;
}) {
  const [adminComments, setAdminComments] = useState(pkg.adminComments || "");
  const [paymentAmount, setPaymentAmount] = useState(pkg.paymentAmount?.toString() || "");
  const [paymentDetails, setPaymentDetails] = useState(pkg.paymentDetails || "");

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'created_manager':
        return [
          { label: 'Передать логисту', value: 'sent_to_logist', icon: Send, color: 'bg-blue-500' }
        ];
      case 'logist_confirmed':
        return [
          { label: 'Передать информацию клиенту', value: 'info_sent_to_client', icon: Send, color: 'bg-green-500' }
        ];
      case 'confirmed_by_client':
        return [
          { label: 'Выставить счет', value: 'awaiting_payment_manager', icon: CreditCard, color: 'bg-orange-500' }
        ];
      case 'awaiting_payment_manager':
        return [
          { label: 'Отправить счет клиенту', value: 'awaiting_payment_client', icon: Send, color: 'bg-blue-500' }
        ];
      case 'awaiting_processing_manager':
        return [
          { label: 'Готово к отправке', value: 'awaiting_shipping_manager', icon: CheckCircle, color: 'bg-green-500' }
        ];
      case 'awaiting_shipping_manager':
        return [
          { label: 'Передать логисту для отправки', value: 'awaiting_shipping_logist', icon: Truck, color: 'bg-purple-500' }
        ];
      case 'sent_by_logist':
        return [
          { label: 'Подтвердить отправку клиенту', value: 'sent_client', icon: CheckCircle, color: 'bg-green-500' }
        ];
      default:
        return [];
    }
  };

  const handleAction = (newStatus: string) => {
    let comments = adminComments;
    
    // For payment-related actions, include payment info
    if (newStatus === 'awaiting_payment_client' && paymentAmount) {
      comments = `${comments}\n\nСумма к оплате: ${paymentAmount} руб.\nРеквизиты: ${paymentDetails}`;
    }
    
    onStatusUpdate(pkg.id, newStatus, comments);
  };

  const actions = getAvailableActions(pkg.status);

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
            <dt className="text-sm font-medium text-gray-500">Магазин</dt>
            <dd className="text-sm text-gray-900">{pkg.shopName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Трекинг</dt>
            <dd className="text-sm text-gray-900">{pkg.trackingNumber}</dd>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Комментарии менеджера</label>
            <Textarea
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              placeholder="Добавить комментарий..."
              className="mt-1"
            />
          </div>

          {/* Payment fields for relevant statuses */}
          {pkg.status === 'confirmed_by_client' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Сумма к оплате</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Реквизиты для оплаты</label>
                <Input
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Номер карты или реквизиты"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.value}
                  onClick={() => handleAction(action.value)}
                  className={`${action.color} hover:opacity-80 text-white flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={onOpenMessages}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Сообщения
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}