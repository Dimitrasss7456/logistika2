// Status utilities for frontend - matching the ТЗ specification

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

export function getStatusColor(status: string): string {
  if (status.includes('created')) return 'bg-blue-100 text-blue-800';
  if (status.includes('awaiting')) return 'bg-yellow-100 text-yellow-800';
  if (status.includes('shipped') || status.includes('paid')) return 'bg-green-100 text-green-800';
  if (status.includes('confirmed')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

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

export function getStatusesForRole(role: string): string[] {
  switch (role) {
    case 'client':
      return [
        'created_client',
        'received_by_logist_client',
        'awaiting_processing_client',
        'awaiting_payment_client',
        'awaiting_shipping_client',
        'shipped_client'
      ];
    case 'logist':
      return [
        'received_info_logist',
        'package_received_logist',
        'awaiting_shipping_logist',
        'shipped_logist',
        'paid_logist'
      ];
    case 'admin':
    case 'manager':
      return [
        'created_manager',
        'sent_to_logist_manager',
        'logist_confirmed_manager',
        'info_sent_to_client_manager',
        'confirmed_by_client_manager',
        'awaiting_payment_manager',
        'awaiting_processing_manager',
        'awaiting_shipping_manager',
        'shipped_by_logist_manager',
        'paid_manager'
      ];
    default:
      return [];
  }
}