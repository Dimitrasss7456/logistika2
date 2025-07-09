import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useConfirmPackage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ packageId, confirmed }: { packageId: number; confirmed: boolean }) => {
      await apiRequest(`/api/packages/${packageId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ confirmed }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: 'Успех',
        description: 'Посылка успешно подтверждена',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить посылку',
        variant: 'destructive',
      });
    },
  });
}

export function usePackageReceived() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (packageId: number) => {
      await apiRequest(`/api/packages/${packageId}/received`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: 'Успех',
        description: 'Получение посылки подтверждено',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить получение посылки',
        variant: 'destructive',
      });
    },
  });
}

export function usePackagePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ packageId, paymentDetails, paymentAmount }: { 
      packageId: number; 
      paymentDetails: string; 
      paymentAmount?: number; 
    }) => {
      await apiRequest(`/api/packages/${packageId}/payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentDetails, paymentAmount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: 'Успех',
        description: 'Оплата успешно подтверждена',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить оплату',
        variant: 'destructive',
      });
    },
  });
}

export function useSendPackage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (packageId: number) => {
      await apiRequest(`/api/packages/${packageId}/send`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: 'Успех',
        description: 'Посылка отправлена',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить посылку',
        variant: 'destructive',
      });
    },
  });
}