import { PackageStatus as Status } from "@/types";

interface PackageStatusProps {
  status: Status;
}

export default function PackageStatus({ status }: PackageStatusProps) {
  const getStatusSteps = (status: Status) => {
    const allSteps = [
      { key: 'created', label: 'Создана' },
      { key: 'received', label: 'Получена логистом' },
      { key: 'payment', label: 'Ожидает оплаты' },
      { key: 'sent', label: 'Отправлена' },
    ];

    let currentStep = 0;
    
    switch (status) {
      case 'created_client':
      case 'created_admin':
      case 'sent_to_logist':
        currentStep = 1;
        break;
      case 'received_info':
      case 'package_received':
      case 'logist_confirmed':
      case 'info_sent_to_client':
      case 'client_received':
      case 'awaiting_processing_client':
      case 'confirmed_by_client':
        currentStep = 2;
        break;
      case 'awaiting_payment_admin':
      case 'awaiting_payment_client':
      case 'awaiting_processing_admin':
      case 'awaiting_shipping_admin':
      case 'awaiting_shipping_client':
      case 'awaiting_shipping_logist':
        currentStep = 3;
        break;
      case 'sent_logist':
      case 'sent_by_logist':
      case 'sent_client':
      case 'paid_logist':
      case 'paid_admin':
        currentStep = 4;
        break;
      default:
        currentStep = 1;
    }

    return { steps: allSteps, current: currentStep };
  };

  const { steps, current } = getStatusSteps(status);
  const progress = (current / steps.length) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        {steps.map((step) => (
          <span key={step.key}>{step.label}</span>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
