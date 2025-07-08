import { Package as PackageType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Upload, MessageSquare, Calendar, MapPin, Package, Truck } from "lucide-react";
import { usePackageMessages } from "@/hooks/usePackages";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import PackageStatus from "./package-status";

interface PackageCardProps {
  package: PackageType;
  onPayment?: (packageId: number) => void;
  onUploadFile?: (packageId: number) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  showActions?: boolean;
}

export default function PackageCard({
  package: pkg,
  onPayment,
  onUploadFile,
  getStatusText,
  getStatusColor,
  showActions = true,
}: PackageCardProps) {
  const { data: messages } = usePackageMessages(pkg.id);

  const canPayment = pkg.status === 'awaiting_payment_client';
  const canUploadFile = pkg.status === 'client_received';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Посылка #{pkg.uniqueNumber}
            </CardTitle>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <Calendar className="h-4 w-4" />
              Создана {formatDistanceToNow(new Date(pkg.createdAt), { 
                addSuffix: true, 
                locale: ru 
              })}
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
            <dt className="text-sm font-medium text-gray-500">Логист</dt>
            <dd className="text-sm text-gray-900 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {pkg.logist.location}
            </dd>
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
            <dt className="text-sm font-medium text-gray-500">Доставка</dt>
            <dd className="text-sm text-gray-900">
              {pkg.deliveryType === 'locker' ? 'Локер' : 'Адрес'}
              {pkg.lockerAddress && ` - ${pkg.lockerAddress}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Трекинг</dt>
            <dd className="text-sm text-gray-900 flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {pkg.trackingNumber}
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

        {/* Status Progress */}
        <PackageStatus status={pkg.status} />

        {/* Actions */}
        {showActions && (canPayment || canUploadFile) && (
          <div className="flex flex-wrap gap-2">
            {canPayment && onPayment && (
              <Button
                onClick={() => onPayment(pkg.id)}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Оплатить
              </Button>
            )}
            {canUploadFile && onUploadFile && (
              <Button
                onClick={() => onUploadFile(pkg.id)}
                variant="outline"
                className="border-gray-500 text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Загрузить файл
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages && messages.length > 0 && (
          <div className="pt-4 border-t border-neutral-border">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Сообщения
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {messages.slice(-3).map((message) => (
                <div key={message.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {message.sender.firstName || message.sender.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{message.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
