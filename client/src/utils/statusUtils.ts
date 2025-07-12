import { PackageStatus } from "@/types";

// Статусы для каждой роли согласно ТЗ
export const CLIENT_STATUSES = {
  created: "Создана",
  received_by_logist: "Получена логистом", 
  awaiting_processing: "Ожидает обработки",
  awaiting_payment: "Ожидает оплаты",
  awaiting_shipping: "Ожидает отправки",
  shipped: "Отправлена"
} as const;

export const LOGIST_STATUSES = {
  sent_to_logist: "Получена информация о посылке",
  received_by_logist: "Посылка получена",
  awaiting_shipping: "Ожидает отправки",
  shipped: "Отправлена",
  paid: "Оплачена"
} as const;

export const MANAGER_STATUSES = {
  created: "Создана",
  sent_to_logist: "Передана логисту",
  logist_confirmed: "Логист подтвердил получение",
  info_sent_to_client: "Передана информация клиенту",
  confirmed_by_client: "Подтверждена клиентом",
  awaiting_payment: "Ожидает оплаты",
  awaiting_processing: "Ожидает обработки",
  awaiting_shipping: "Ожидает отправки",
  shipped: "Отправлена логистом",
  paid: "Оплачена"
} as const;

export function getStatusLabel(status: PackageStatus, userRole: string): string {
  switch (userRole) {
    case "client":
      return CLIENT_STATUSES[status as keyof typeof CLIENT_STATUSES] || status;
    case "logist":
      return LOGIST_STATUSES[status as keyof typeof LOGIST_STATUSES] || status;
    case "manager":
    case "admin":
      return MANAGER_STATUSES[status as keyof typeof MANAGER_STATUSES] || status;
    default:
      return status;
  }
}

export function getVisibleStatusesForRole(userRole: string): PackageStatus[] {
  switch (userRole) {
    case "client":
      return Object.keys(CLIENT_STATUSES) as PackageStatus[];
    case "logist":
      return Object.keys(LOGIST_STATUSES) as PackageStatus[];
    case "manager":
    case "admin":
      return Object.keys(MANAGER_STATUSES) as PackageStatus[];
    default:
      return [];
  }
}

export function canUserInteractWithStatus(status: PackageStatus, userRole: string): boolean {
  switch (userRole) {
    case "client":
      return status === "received_by_logist" || status === "awaiting_payment";
    case "logist":
      return status === "sent_to_logist" || status === "awaiting_shipping";
    case "manager":
    case "admin":
      return [
        "created",
        "logist_confirmed", 
        "confirmed_by_client",
        "awaiting_processing",
        "shipped"
      ].includes(status);
    default:
      return false;
  }
}

export function getStatusColor(status: PackageStatus): string {
  switch (status) {
    case "created":
      return "bg-blue-100 text-blue-800";
    case "sent_to_logist":
      return "bg-purple-100 text-purple-800";
    case "received_by_logist":
      return "bg-orange-100 text-orange-800";
    case "logist_confirmed":
      return "bg-indigo-100 text-indigo-800";
    case "info_sent_to_client":
      return "bg-cyan-100 text-cyan-800";
    case "confirmed_by_client":
      return "bg-teal-100 text-teal-800";
    case "awaiting_payment":
      return "bg-yellow-100 text-yellow-800";
    case "awaiting_processing":
      return "bg-amber-100 text-amber-800";
    case "awaiting_shipping":
      return "bg-pink-100 text-pink-800";
    case "shipped":
      return "bg-green-100 text-green-800";
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export const getNextStatuses = (currentStatus: string): { value: string; label: string }[] => {
  const statusFlow = {
    created_client: [
      { value: 'confirmed_manager', label: 'Подтверждено менеджером' },
      { value: 'cancelled', label: 'Отменено' }
    ],
    confirmed_manager: [
      { value: 'accepted_by_logist', label: 'Принято логистом' },
      { value: 'cancelled', label: 'Отменено' }
    ],
    accepted_by_logist: [
      { value: 'in_transit', label: 'В пути' },
      { value: 'cancelled', label: 'Отменено' }
    ],
    in_transit: [
      { value: 'out_for_delivery', label: 'На доставке' },
      { value: 'cancelled', label: 'Отменено' }
    ],
    out_for_delivery: [
      { value: 'delivered', label: 'Доставлено' },
      { value: 'failed_delivery', label: 'Неудачная доставка' }
    ],
    failed_delivery: [
      { value: 'out_for_delivery', label: 'Повторная доставка' },
      { value: 'cancelled', label: 'Отменено' }
    ],
    delivered: [],
    cancelled: []
  };

  return statusFlow[currentStatus] || [];
};

export const getStatusLabel = (status: string): string => {
  const labels = {
    created_client: 'Создано клиентом',
    confirmed_manager: 'Подтверждено менеджером',
    accepted_by_logist: 'Принято логистом',
    in_transit: 'В пути',
    out_for_delivery: 'На доставке',
    delivered: 'Доставлено',
    failed_delivery: 'Неудачная доставка',
    cancelled: 'Отменено'
  };

  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors = {
    created_client: 'bg-blue-100 text-blue-800',
    confirmed_manager: 'bg-yellow-100 text-yellow-800',
    accepted_by_logist: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-orange-100 text-orange-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    failed_delivery: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};