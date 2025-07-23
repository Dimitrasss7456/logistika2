// Package status workflow according to ТЗ specification
export type PackageStatus = 
  // Client statuses
  | "created_client" // Создана (клиент)
  | "received_by_logist_client" // Получена логистом (клиент)
  | "awaiting_processing_client" // Ожидает обработки (клиент)
  | "awaiting_payment_client" // Ожидает оплаты (клиент)
  | "awaiting_shipping_client" // Ожидает отправки (клиент)
  | "shipped_client" // Отправлена (клиент)
  
  // Logist statuses
  | "received_info_logist" // Получена информация о посылке (логист)
  | "package_received_logist" // Посылка получена (логист)
  | "awaiting_shipping_logist" // Ожидает отправки (логист)
  | "shipped_logist" // Отправлена (логист)
  | "paid_logist" // Оплачена (логист)
  
  // Manager/Admin statuses
  | "created_manager" // Создана (менеджер)
  | "sent_to_logist_manager" // Передана логисту (менеджер)
  | "logist_confirmed_manager" // Логист подтвердил получение (менеджер)
  | "info_sent_to_client_manager" // Передана информация клиенту (менеджер)
  | "confirmed_by_client_manager" // Подтверждена клиентом (менеджер)
  | "awaiting_payment_manager" // Ожидает оплаты (менеджер)
  | "awaiting_processing_manager" // Ожидает обработки (менеджер)
  | "awaiting_shipping_manager" // Ожидает отправки (менеджер)
  | "shipped_by_logist_manager" // Отправлена логистом (менеджер)
  | "paid_manager"; // Оплачена (менеджер)

// Status workflow definitions according to ТЗ
export const statusWorkflow: Record<PackageStatus, { 
  nextStatus?: PackageStatus[], 
  role: string, 
  canInteract: boolean,
  label: string,
  description: string 
}> = {
  // Client workflow: Создана - Получена логистом - Ожидает обработки – Ожидает оплаты – Ожидает отправки - Отправлена
  "created_client": {
    role: "client",
    canInteract: false,
    label: "Создана",
    description: "Посылка создана и ожидает обработки менеджером"
  },
  "received_by_logist_client": {
    nextStatus: ["awaiting_processing_client"],
    role: "client", 
    canInteract: true,
    label: "Получена логистом",
    description: "Логист получил посылку. Подтвердите получение и загрузите файл"
  },
  "awaiting_processing_client": {
    role: "client",
    canInteract: false,
    label: "Ожидает обработки",
    description: "Ожидает обработки менеджером"
  },
  "awaiting_payment_client": {
    nextStatus: ["awaiting_shipping_client"],
    role: "client",
    canInteract: true,
    label: "Ожидает оплаты",
    description: "Оплатите посылку и загрузите подтверждение"
  },
  "awaiting_shipping_client": {
    role: "client",
    canInteract: false,
    label: "Ожидает отправки",
    description: "Ожидает отправки логистом"
  },
  "shipped_client": {
    role: "client",
    canInteract: false,
    label: "Отправлена",
    description: "Посылка отправлена"
  },

  // Logist workflow: Получена информация о посылке - Посылка получена - Ожидает отправки – Отправлена – Оплачена
  "received_info_logist": {
    nextStatus: ["package_received_logist"],
    role: "logist",
    canInteract: true,
    label: "Получена информация о посылке",
    description: "Ожидает получения посылки"
  },
  "package_received_logist": {
    role: "logist",
    canInteract: false,
    label: "Посылка получена",
    description: "Посылка получена, ожидает обработки"
  },
  "awaiting_shipping_logist": {
    nextStatus: ["shipped_logist"],
    role: "logist",
    canInteract: true,
    label: "Ожидает отправки",
    description: "Готова к отправке"
  },
  "shipped_logist": {
    nextStatus: ["paid_logist"],
    role: "logist",
    canInteract: false,
    label: "Отправлена",
    description: "Посылка отправлена"
  },
  "paid_logist": {
    role: "logist",
    canInteract: false,
    label: "Оплачена",
    description: "Работа завершена"
  },

  // Manager workflow: Создана - Передана логисту - Логист подтвердил получение - Передана информация клиенту - Подтверждена клиентом – Ожидает оплаты - Ожидает обработки - Ожидает отправки - Отправлена логистом – Оплачена
  "created_manager": {
    nextStatus: ["sent_to_logist_manager"],
    role: "manager",
    canInteract: true,
    label: "Создана",
    description: "Проверьте информацию и передайте логисту"
  },
  "sent_to_logist_manager": {
    role: "manager",
    canInteract: false,
    label: "Передана логисту",
    description: "Ожидает получения логистом"
  },
  "logist_confirmed_manager": {
    nextStatus: ["info_sent_to_client_manager"],
    role: "manager",
    canInteract: true,
    label: "Логист подтвердил получение",
    description: "Проверьте информацию и отправьте клиенту"
  },
  "info_sent_to_client_manager": {
    role: "manager",
    canInteract: false,
    label: "Передана информация клиенту",
    description: "Ожидает подтверждения от клиента"
  },
  "confirmed_by_client_manager": {
    nextStatus: ["awaiting_payment_manager"],
    role: "manager",
    canInteract: true,
    label: "Подтверждена клиентом",
    description: "Сформируйте сумму для оплаты"
  },
  "awaiting_payment_manager": {
    role: "manager",
    canInteract: false,
    label: "Ожидает оплаты",
    description: "Ожидает оплаты от клиента"
  },
  "awaiting_processing_manager": {
    nextStatus: ["awaiting_shipping_manager"],
    role: "manager", 
    canInteract: true,
    label: "Ожидает обработки",
    description: "Проверьте оплату и подготовьте к отправке"
  },
  "awaiting_shipping_manager": {
    role: "manager",
    canInteract: false,
    label: "Ожидает отправки",
    description: "Ожидает отправки логистом"
  },
  "shipped_by_logist_manager": {
    nextStatus: ["paid_manager"],
    role: "manager",
    canInteract: true,
    label: "Отправлена логистом",
    description: "Проверьте отправку и уведомите клиента"
  },
  "paid_manager": {
    role: "manager",
    canInteract: false,
    label: "Оплачена",
    description: "Процесс завершен"
  }
};

// Automatic status transitions according to ТЗ
export const automaticTransitions: Record<PackageStatus, PackageStatus[]> = {
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
  "paid_manager": ["paid_logist"]
};

// Get statuses visible to each role
export function getStatusesForRole(role: string): PackageStatus[] {
  return Object.keys(statusWorkflow).filter(status => 
    statusWorkflow[status as PackageStatus].role === role || role === "admin"
  ) as PackageStatus[];
}

// Check if user can interact with status
export function canUserInteract(status: PackageStatus, role: string): boolean {
  const statusInfo = statusWorkflow[status];
  return statusInfo.role === role && statusInfo.canInteract;
}

// Get display name for status
export function getStatusDisplayName(status: PackageStatus): string {
  return statusWorkflow[status]?.label || status;
}

// Get status description
export function getStatusDescription(status: PackageStatus): string {
  return statusWorkflow[status]?.description || "";
}

// Get next possible statuses
export function getNextStatuses(status: PackageStatus): PackageStatus[] {
  return statusWorkflow[status]?.nextStatus || [];
}

// Execute automatic transitions
export function getAutomaticTransitions(status: PackageStatus): PackageStatus[] {
  return automaticTransitions[status] || [];
}