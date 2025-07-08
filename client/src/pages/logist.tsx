import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Upload, CheckCircle } from "lucide-react";
import { usePackages } from "@/hooks/usePackages";
import { Package as PackageType } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import FileUploadModal from "@/components/modals/file-upload-modal";

export default function Logist() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<'proof' | 'shipping'>('proof');

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
    status: statusFilter,
    search: searchTerm,
  });

  const handleFileUpload = (packageId: number, type: 'proof' | 'shipping') => {
    setSelectedPackageId(packageId);
    setUploadType(type);
    setFileUploadOpen(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'received_info': 'Получена информация о посылке',
      'package_received': 'Посылка получена',
      'awaiting_shipping_logist': 'Ожидает отправки',
      'sent_logist': 'Отправлена',
      'paid_logist': 'Оплачена',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'received_info': 'bg-blue-100 text-blue-800',
      'package_received': 'bg-green-100 text-green-800',
      'awaiting_shipping_logist': 'bg-yellow-100 text-yellow-800',
      'sent_logist': 'bg-emerald-100 text-emerald-800',
      'paid_logist': 'bg-purple-100 text-purple-800',
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

  if (!isAuthenticated || !user || user.role !== 'logist') {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель логиста
          </h1>
          <p className="text-gray-600">
            Управление посылками и отслеживание доставки
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Поиск по номеру посылки..."
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
                  <SelectItem value="received_info">Получена информация</SelectItem>
                  <SelectItem value="package_received">Посылка получена</SelectItem>
                  <SelectItem value="awaiting_shipping_logist">Ожидает отправки</SelectItem>
                  <SelectItem value="sent_logist">Отправлена</SelectItem>
                  <SelectItem value="paid_logist">Оплачена</SelectItem>
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
              <LogistPackageCard
                key={pkg.id}
                package={pkg}
                onFileUpload={handleFileUpload}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}

        {/* File Upload Modal */}
        <FileUploadModal
          open={fileUploadOpen}
          onOpenChange={setFileUploadOpen}
          packageId={selectedPackageId}
          fileType={uploadType}
        />
      </div>
    </div>
  );
}

function LogistPackageCard({
  package: pkg,
  onFileUpload,
  getStatusText,
  getStatusColor,
}: {
  package: PackageType;
  onFileUpload: (id: number, type: 'proof' | 'shipping') => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}) {
  const canUploadProof = pkg.status === 'received_info';
  const canUploadShipping = pkg.status === 'awaiting_shipping_logist';

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
          <div>
            <dt className="text-sm font-medium text-gray-500">Доставка</dt>
            <dd className="text-sm text-gray-900">
              {pkg.deliveryType === 'locker' ? 'Локер' : 'Адрес'}
              {pkg.lockerAddress && ` - ${pkg.lockerAddress}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Дата доставки</dt>
            <dd className="text-sm text-gray-900">
              {pkg.estimatedDeliveryDate
                ? new Date(pkg.estimatedDeliveryDate).toLocaleDateString()
                : 'Не указана'}
            </dd>
          </div>
        </div>

        {pkg.adminComments && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Комментарии администратора:
            </h4>
            <p className="text-sm text-blue-800">{pkg.adminComments}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canUploadProof && (
            <Button
              onClick={() => onFileUpload(pkg.id, 'proof')}
              className="bg-success hover:bg-green-600 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Подтвердить получение
            </Button>
          )}
          {canUploadShipping && (
            <Button
              onClick={() => onFileUpload(pkg.id, 'shipping')}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Подтвердить отправку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
