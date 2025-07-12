import { PackageStatus } from "@/types";
```

```typescript
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
    created: [
      { value: 'sent_to_logist', label: 'Передать логисту' }
    ],
    sent_to_logist: [
      { value: 'logist_confirmed', label: 'Логист подтвердил' }
    ],
    logist_confirmed: [
      { value: 'info_sent_to_client', label: 'Передать информацию клиенту' }
    ],
    info_sent_to_client: [
      { value: 'confirmed_by_client', label: 'Клиент подтвердил' }
    ],
    confirmed_by_client: [
      { value: 'awaiting_payment', label: 'Ожидает оплаты' }
    ],
    awaiting_payment: [
      { value: 'awaiting_processing', label: 'В обработке' }
    ],
    awaiting_processing: [
      { value: 'awaiting_shipping', label: 'Готов к отправке' }
    ],
    awaiting_shipping: [
      { value: 'shipped', label: 'Отправлено' }
    ],
    shipped: [
      { value: 'paid', label: 'Оплачено' }
    ],
    paid: []
  };

  return statusFlow[currentStatus] || [];
};