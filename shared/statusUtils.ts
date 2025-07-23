// Status workflow utilities according to ТЗ specification

export interface StatusFlow {
  client: string[];
  logist: string[];
  manager: string[];
}

// Status flow according to ТЗ specification
export const statusFlow: StatusFlow = {
  client: [
    'created_client', // Создана
    'received_by_logist_client', // Получена логистом  
    'awaiting_processing_client', // Ожидает обработки
    'awaiting_payment_client', // Ожидает оплаты
    'awaiting_shipping_client', // Ожидает отправки
    'shipped_client', // Отправлена
  ],
  logist: [
    'received_info_logist', // Получена информация о посылке
    'package_received_logist', // Посылка получена
    'awaiting_shipping_logist', // Ожидает отправки
    'shipped_logist', // Отправлена
    'paid_logist', // Оплачена
  ],
  manager: [
    'created_manager', // Создана
    'sent_to_logist_manager', // Передана логисту
    'logist_confirmed_manager', // Логист подтвердил получение
    'info_sent_to_client_manager', // Передана информация клиенту
    'confirmed_by_client_manager', // Подтверждена клиентом
    'awaiting_payment_manager', // Ожидает оплаты
    'awaiting_processing_manager', // Ожидает обработки
    'awaiting_shipping_manager', // Ожидает отправки
    'shipped_by_logist_manager', // Отправлена логистом
    'paid_manager', // Оплачена
  ],
};

// Get status display name
export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    // Client statuses
    'created_client': 'Создана',
    'received_by_logist_client': 'Получена логистом',
    'awaiting_processing_client': 'Ожидает обработки',
    'awaiting_payment_client': 'Ожидает оплаты',
    'awaiting_shipping_client': 'Ожидает отправки',
    'shipped_client': 'Отправлена',
    
    // Logist statuses
    'received_info_logist': 'Получена информация о посылке',
    'package_received_logist': 'Посылка получена',
    'awaiting_shipping_logist': 'Ожидает отправки',
    'shipped_logist': 'Отправлена',
    'paid_logist': 'Оплачена',
    
    // Manager statuses
    'created_manager': 'Создана',
    'sent_to_logist_manager': 'Передана логисту',
    'logist_confirmed_manager': 'Логист подтвердил получение',
    'info_sent_to_client_manager': 'Передана информация клиенту',
    'confirmed_by_client_manager': 'Подтверждена клиентом',
    'awaiting_payment_manager': 'Ожидает оплаты',
    'awaiting_processing_manager': 'Ожидает обработки',
    'awaiting_shipping_manager': 'Ожидает отправки',
    'shipped_by_logist_manager': 'Отправлена логистом',
    'paid_manager': 'Оплачена',
  };
  
  return statusMap[status] || status;
}

// Get statuses for specific role
export function getStatusesForRole(role: 'client' | 'logist' | 'manager' | 'admin'): string[] {
  if (role === 'admin') return statusFlow.manager;
  return statusFlow[role] || [];
}

// Check if user can interact with package at this status
export function canInteractWithStatus(status: string, role: string): boolean {
  const interactionRules: Record<string, string[]> = {
    // Client can interact at these statuses
    'received_by_logist_client': ['client'],
    'awaiting_payment_client': ['client'],
    
    // Logist can interact at these statuses
    'received_info_logist': ['logist'],
    'awaiting_shipping_logist': ['logist'],
    
    // Manager can interact at these statuses (mandatory actions)
    'created_manager': ['admin', 'manager'],
    'logist_confirmed_manager': ['admin', 'manager'],
    'confirmed_by_client_manager': ['admin', 'manager'],
    'awaiting_processing_manager': ['admin', 'manager'],
    'shipped_by_logist_manager': ['admin', 'manager'],
  };
  
  return interactionRules[status]?.includes(role) || false;
}

// Get next status in workflow
export function getNextStatus(currentStatus: string, action: string, role: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    // Client transitions
    'received_by_logist_client': {
      'confirm': 'awaiting_processing_client',
      'reject': 'awaiting_processing_client',
    },
    'awaiting_payment_client': {
      'pay': 'awaiting_shipping_client',
    },
    
    // Logist transitions
    'received_info_logist': {
      'confirm_received': 'package_received_logist',
    },
    'awaiting_shipping_logist': {
      'ship': 'shipped_logist',
    },
    
    // Manager transitions
    'created_manager': {
      'send_to_logist': 'sent_to_logist_manager',
    },
    'logist_confirmed_manager': {
      'send_to_client': 'info_sent_to_client_manager',
    },
    'confirmed_by_client_manager': {
      'send_payment_info': 'awaiting_payment_manager',
    },
    'awaiting_processing_manager': {
      'send_to_logist': 'awaiting_shipping_manager',
    },
    'shipped_by_logist_manager': {
      'confirm_shipped': 'shipped_client',
    },
  };
  
  return transitions[currentStatus]?.[action] || null;
}

// Automatic status transitions when package status changes
export function getCorrespondingStatuses(status: string): { client?: string; logist?: string; manager?: string } {
  const correspondingStatuses: Record<string, { client?: string; logist?: string; manager?: string }> = {
    // When client creates package
    'created_client': { manager: 'created_manager' },
    
    // When manager sends to logist
    'sent_to_logist_manager': { logist: 'received_info_logist' },
    
    // When logist confirms receipt
    'package_received_logist': { manager: 'logist_confirmed_manager' },
    
    // When manager sends info to client
    'info_sent_to_client_manager': { client: 'received_by_logist_client' },
    
    // When client confirms
    'awaiting_processing_client': { manager: 'confirmed_by_client_manager' },
    
    // When manager sends payment info
    'awaiting_payment_manager': { client: 'awaiting_payment_client' },
    
    // When client pays
    'awaiting_shipping_client': { manager: 'awaiting_processing_manager' },
    
    // When manager sends to logist for shipping
    'awaiting_shipping_manager': { logist: 'awaiting_shipping_logist' },
    
    // When logist ships
    'shipped_logist': { manager: 'shipped_by_logist_manager' },
    
    // When manager confirms shipped to client
    'shipped_client': { logist: 'paid_logist', manager: 'paid_manager' },
  };
  
  return correspondingStatuses[status] || {};
}