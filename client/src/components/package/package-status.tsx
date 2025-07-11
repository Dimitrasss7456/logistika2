import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PackageStatusProps {
  status: string;
  userRole?: 'admin' | 'client' | 'logist';
}

export default function PackageStatus({ status, userRole }: PackageStatusProps) {
  const getStatusInfo = (status: string, role?: string) => {
    const statusMap = {
      // Client statuses
      'created_client': { text: 'Создана', color: 'bg-blue-100 text-blue-800', progress: 10 },
      'client_received': { text: 'Получена логистом', color: 'bg-green-100 text-green-800', progress: 30 },
      'awaiting_processing_client': { text: 'Ожидает обработки', color: 'bg-yellow-100 text-yellow-800', progress: 50 },
      'awaiting_payment_client': { text: 'Ожидает оплаты', color: 'bg-orange-100 text-orange-800', progress: 70 },
      'awaiting_shipping_client': { text: 'Ожидает отправки', color: 'bg-purple-100 text-purple-800', progress: 85 },
      'sent_client': { text: 'Отправлена', color: 'bg-emerald-100 text-emerald-800', progress: 100 },
      
      // Logist statuses
      'received_info': { text: 'Получена информация о посылке', color: 'bg-blue-100 text-blue-800', progress: 20 },
      'package_received': { text: 'Посылка получена', color: 'bg-green-100 text-green-800', progress: 40 },
      'awaiting_shipping_logist': { text: 'Ожидает отправки', color: 'bg-yellow-100 text-yellow-800', progress: 80 },
      'sent_logist': { text: 'Отправлена', color: 'bg-emerald-100 text-emerald-800', progress: 90 },
      'paid_logist': { text: 'Оплачена', color: 'bg-purple-100 text-purple-800', progress: 100 },
      
      // Admin statuses
      'created_admin': { text: 'Создана', color: 'bg-blue-100 text-blue-800', progress: 10 },
      'sent_to_logist': { text: 'Передана логисту', color: 'bg-indigo-100 text-indigo-800', progress: 20 },
      'logist_confirmed': { text: 'Логист подтвердил получение', color: 'bg-green-100 text-green-800', progress: 40 },
      'info_sent_to_client': { text: 'Передана информация клиенту', color: 'bg-teal-100 text-teal-800', progress: 50 },
      'confirmed_by_client': { text: 'Подтверждена клиентом', color: 'bg-cyan-100 text-cyan-800', progress: 60 },
      'awaiting_payment_admin': { text: 'Ожидает оплаты', color: 'bg-orange-100 text-orange-800', progress: 70 },
      'awaiting_processing_admin': { text: 'Ожидает обработки', color: 'bg-yellow-100 text-yellow-800', progress: 75 },
      'awaiting_shipping_admin': { text: 'Ожидает отправки', color: 'bg-purple-100 text-purple-800', progress: 80 },
      'sent_by_logist': { text: 'Отправлена логистом', color: 'bg-emerald-100 text-emerald-800', progress: 90 },
      'paid_admin': { text: 'Оплачена', color: 'bg-purple-100 text-purple-800', progress: 100 },
    };

    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      color: 'bg-gray-100 text-gray-800', 
      progress: 0 
    };
  };

  const getIcon = (status: string) => {
    if (status.includes('created')) return <Package className="h-4 w-4" />;
    if (status.includes('sent') || status.includes('shipping')) return <Truck className="h-4 w-4" />;
    if (status.includes('confirmed') || status.includes('paid')) return <CheckCircle className="h-4 w-4" />;
    if (status.includes('awaiting') || status.includes('processing')) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const statusInfo = getStatusInfo(status, userRole);
  const icon = getIcon(status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge className={`${statusInfo.color} flex items-center gap-1`}>
          {icon}
          {statusInfo.text}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Прогресс</span>
          <span className="text-gray-900">{statusInfo.progress}%</span>
        </div>
        <Progress value={statusInfo.progress} className="h-2" />
      </div>
      
      {userRole && (
        <div className="text-xs text-gray-500">
          Просмотр: {userRole === 'admin' ? 'Администратор' : userRole === 'client' ? 'Клиент' : 'Логист'}
        </div>
      )}
    </div>
  );
}