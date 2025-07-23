import { PackageStatus } from "@/types";

// Status workflow definitions according to ТЗ
export const statusWorkflow = {
  // Client workflow: Создана - Получена логистом - Ожидает обработки – Ожидает оплаты – Ожидает отправки - Отправлена
  client: [
    "created_client", // Создана (клиент)
    "received_by_logist_client", // Получена логистом (клиент)
    "awaiting_processing_client", // Ожидает обработки (клиент)
    "awaiting_payment_client", // Ожидает оплаты (клиент)
    "awaiting_shipping_client", // Ожидает отправки (клиент)
    "shipped_client", // Отправлена (клиент)
  ] as PackageStatus[],

  // Logist workflow: Получена информация о посылке - Посылка получена - Ожидает отправки – Отправлена – Оплачена
  logist: [
    "received_info_logist", // Получена информация о посылке (логист)
    "package_received_logist", // Посылка получена (логист)
    "awaiting_shipping_logist", // Ожидает отправки (логист)
    "shipped_logist", // Отправлена (логист)
    "paid_logist", // Оплачена (логист)
  ] as PackageStatus[],

  // Manager workflow: Создана - Передана логисту - Логист подтвердил получение - Передана информация клиенту - Подтверждена клиентом – Ожидает оплаты - Ожидает обработки - Ожидает отправки - Отправлена логистом – Оплачена
  manager: [
    "created_manager", // Создана (менеджер)
    "sent_to_logist_manager", // Передана логисту (менеджер)
    "logist_confirmed_manager", // Логист подтвердил получение (менеджер)
    "info_sent_to_client_manager", // Передана информация клиенту (менеджер)
    "confirmed_by_client_manager", // Подтверждена клиентом (менеджер)
    "awaiting_payment_manager", // Ожидает оплаты (менеджер)
    "awaiting_processing_manager", // Ожидает обработки (менеджер)
    "awaiting_shipping_manager", // Ожидает отправки (менеджер)
    "shipped_by_logist_manager", // Отправлена логистом (менеджер)
    "paid_manager", // Оплачена (менеджер)
  ] as PackageStatus[]
};

// Status display names according to ТЗ
export const statusDisplayNames: Record<PackageStatus, string> = {
  // Client statuses
  "created_client": "Создана",
  "received_by_logist_client": "Получена логистом",
  "awaiting_processing_client": "Ожидает обработки",
  "awaiting_payment_client": "Ожидает оплаты",
  "awaiting_shipping_client": "Ожидает отправки",
  "shipped_client": "Отправлена",
  
  // Logist statuses
  "received_info_logist": "Получена информация о посылке",
  "package_received_logist": "Посылка получена",
  "awaiting_shipping_logist": "Ожидает отправки",
  "shipped_logist": "Отправлена",
  "paid_logist": "Оплачена",
  
  // Manager/Admin statuses
  "created_manager": "Создана",
  "sent_to_logist_manager": "Передана логисту",
  "logist_confirmed_manager": "Логист подтвердил получение",
  "info_sent_to_client_manager": "Передана информация клиенту",
  "confirmed_by_client_manager": "Подтверждена клиентом",
  "awaiting_payment_manager": "Ожидает оплаты",
  "awaiting_processing_manager": "Ожидает обработки",
  "awaiting_shipping_manager": "Ожидает отправки",
  "shipped_by_logist_manager": "Отправлена логистом",
  "paid_manager": "Оплачена",
};

// Interactive statuses - where user can take action
export const interactiveStatuses: Record<string, PackageStatus[]> = {
  client: [
    "received_by_logist_client", // Can confirm and upload file
    "awaiting_payment_client", // Can pay and upload file
  ],
  logist: [
    "received_info_logist", // Can confirm receipt with photo/video
    "awaiting_shipping_logist", // Can mark as shipped with proof
  ],
  manager: [
    "created_manager", // Can send to logist
    "logist_confirmed_manager", // Can send info to client
    "confirmed_by_client_manager", // Can set payment amount
    "awaiting_processing_manager", // Can prepare for shipping
    "shipped_by_logist_manager", // Can confirm and notify client
  ],
  admin: [
    "created_manager",
    "logist_confirmed_manager", 
    "confirmed_by_client_manager",
    "awaiting_processing_manager",
    "shipped_by_logist_manager",
  ]
};

// Status descriptions according to ТЗ
export const statusDescriptions: Record<PackageStatus, string> = {
  // Client statuses
  "created_client": "Посылка создана и ожидает обработки менеджером",
  "received_by_logist_client": "Логист получил посылку. Подтвердите получение и загрузите файл для отправки",
  "awaiting_processing_client": "Ожидает обработки менеджером",
  "awaiting_payment_client": "Оплатите посылку по реквизитам и загрузите подтверждение оплаты",
  "awaiting_shipping_client": "Ожидает отправки логистом",
  "shipped_client": "Посылка отправлена",
  
  // Logist statuses
  "received_info_logist": "Получена информация о посылке. Ожидайте получения посылки",
  "package_received_logist": "Посылка получена, ожидает дальнейших инструкций",
  "awaiting_shipping_logist": "Готова к отправке. Отправьте посылку и загрузите доказательство",
  "shipped_logist": "Посылка отправлена, ожидает оплаты",
  "paid_logist": "Работа завершена, оплата получена",
  
  // Manager/Admin statuses
  "created_manager": "Проверьте информацию о посылке и передайте логисту",
  "sent_to_logist_manager": "Ожидает получения логистом",
  "logist_confirmed_manager": "Проверьте информацию от логиста и отправьте клиенту",
  "info_sent_to_client_manager": "Ожидает подтверждения от клиента",
  "confirmed_by_client_manager": "Сформируйте сумму для оплаты и отправьте клиенту",
  "awaiting_payment_manager": "Ожидает оплаты от клиента",
  "awaiting_processing_manager": "Проверьте оплату и подготовьте файлы для отправки",
  "awaiting_shipping_manager": "Ожидает отправки логистом",
  "shipped_by_logist_manager": "Проверьте отправку и уведомите клиента",
  "paid_manager": "Процесс завершен, все оплачено",
};

// Get statuses for role
export function getStatusesForRole(role: string): PackageStatus[] {
  if (role === "admin") {
    return [...statusWorkflow.manager]; // Admin sees all manager statuses
  }
  return statusWorkflow[role as keyof typeof statusWorkflow] || [];
}

// Check if user can interact with package in this status
export function canUserInteract(status: PackageStatus, role: string): boolean {
  const roleStatuses = interactiveStatuses[role] || [];
  return roleStatuses.includes(status);
}

// Get display name for status
export function getStatusDisplayName(status: PackageStatus): string {
  return statusDisplayNames[status] || status;
}

// Get status description
export function getStatusDescription(status: PackageStatus): string {
  return statusDescriptions[status] || "";
}

// Get automatic status transitions according to ТЗ
export function getAutomaticTransitions(currentStatus: PackageStatus): PackageStatus[] {
  const transitions: Record<PackageStatus, PackageStatus[]> = {
    // When client creates package, automatically create for manager
    "created_client": ["created_manager"],
    
    // When manager sends to logist, create logist status  
    "sent_to_logist_manager": ["received_info_logist"],
    
    // When logist confirms receipt, update manager
    "package_received_logist": ["logist_confirmed_manager"],
    
    // When manager sends info to client, update client status
    "info_sent_to_client_manager": ["received_by_logist_client"],
    
    // When client confirms, update manager
    "awaiting_processing_client": ["confirmed_by_client_manager"],
    
    // When manager sets payment, update client
    "awaiting_payment_manager": ["awaiting_payment_client"],
    
    // When client pays, update manager
    "awaiting_shipping_client": ["awaiting_processing_manager"],
    
    // When manager prepares shipping, update logist
    "awaiting_shipping_manager": ["awaiting_shipping_logist"],
    
    // When logist ships, update manager
    "shipped_logist": ["shipped_by_logist_manager"],
    
    // When manager confirms shipping, update client  
    "shipped_by_logist_manager": ["shipped_client"],
    
    // Manual payment sets all to paid
    "paid_manager": ["paid_logist"],
  };
  
  return transitions[currentStatus] || [];
}

// Get next status in workflow for manual transitions
export function getNextStatus(currentStatus: PackageStatus, role: string): PackageStatus | null {
  const roleStatuses = statusWorkflow[role as keyof typeof statusWorkflow];
  if (!roleStatuses) return null;
  
  const currentIndex = roleStatuses.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === roleStatuses.length - 1) return null;
  
  return roleStatuses[currentIndex + 1];
}

// Get status color for badges
export function getStatusColor(status: string): string {
  if (status.includes('created')) return 'bg-blue-100 text-blue-800';
  if (status.includes('awaiting')) return 'bg-yellow-100 text-yellow-800';
  if (status.includes('shipped') || status.includes('paid')) return 'bg-green-100 text-green-800';
  if (status.includes('confirmed')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

// Client interaction functions for backward compatibility
export function canClientInteract(status: string): boolean {
  return ['received_by_logist_client', 'awaiting_payment_client'].includes(status);
}

export function canLogistInteract(status: string): boolean {
  return ['received_info_logist', 'awaiting_shipping_logist'].includes(status);
}

export function canManagerInteract(status: string): boolean {
  return [
    'created_manager',
    'logist_confirmed_manager', 
    'confirmed_by_client_manager',
    'awaiting_processing_manager',
    'shipped_by_logist_manager'
  ].includes(status);
}

export function getClientActions(status: string): Array<{label: string, action: string, variant?: 'default' | 'destructive'}> {
  switch (status) {
    case 'received_by_logist_client':
      return [
        { label: 'Подтвердить', action: 'confirm' },
        { label: 'Отклонить', action: 'reject', variant: 'destructive' }
      ];
    case 'awaiting_payment_client':
      return [
        { label: 'Оплатить', action: 'pay' }
      ];
    default:
      return [];
  }
}

export function getLogistActions(status: string): Array<{label: string, action: string}> {
  switch (status) {
    case 'received_info_logist':
      return [{ label: 'Подтвердить получение', action: 'confirm_received' }];
    case 'awaiting_shipping_logist':
      return [{ label: 'Отправить', action: 'ship' }];
    default:
      return [];
  }
}

export function getManagerActions(status: string): Array<{label: string, action: string}> {
  switch (status) {
    case 'created_manager':
      return [{ label: 'Передать логисту', action: 'send_to_logist' }];
    case 'logist_confirmed_manager':
      return [{ label: 'Отправить информацию клиенту', action: 'send_to_client' }];
    case 'confirmed_by_client_manager':
      return [{ label: 'Отправить данные об оплате', action: 'send_payment_info' }];
    case 'awaiting_processing_manager':
      return [{ label: 'Отправить на доставку', action: 'send_to_logist' }];
    case 'shipped_by_logist_manager':
      return [{ label: 'Подтвердить доставку клиенту', action: 'confirm_shipped' }];
    default:
      return [];
  }
}

// Constants for backward compatibility
export const CLIENT_STATUSES = statusWorkflow.client;
export const LOGIST_STATUSES = statusWorkflow.logist; 
export const MANAGER_STATUSES = statusWorkflow.manager;
export const ADMIN_STATUSES = statusWorkflow.manager; // Admin sees manager statuses