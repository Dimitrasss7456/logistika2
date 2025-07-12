import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Package, PackageStatus } from "@/types";

export function usePackages(filters?: { status?: string; search?: string; limit?: number }) {
  const queryKey = ['/api/packages'];

  // Build query string - only add parameters if they have meaningful values
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all' && filters.status !== undefined) {
    params.append('status', filters.status);
  }
  if (filters?.search && filters.search.trim() !== '') {
    params.append('search', filters.search);
  }
  if (filters?.limit && filters.limit > 0) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/api/packages?${queryString}` : '/api/packages';

  return useQuery({
    queryKey: [...queryKey, filters],
    queryFn: async () => {
      console.log('Fetching packages from:', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      const data = await response.json();
      console.log('Received packages:', data);
      return data;
    },
  });
}

export function usePackage(id: number) {
  return useQuery<Package>({
    queryKey: ['/api/packages', id],
    queryFn: async () => {
      const response = await fetch(`/api/packages/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch package');
      return response.json();
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageData: {
      logistId: number;
      telegramUsername: string;
      recipientName: string;
      deliveryType: 'locker' | 'address';
      lockerAddress?: string;
      lockerCode?: string;
      courierService: string;
      trackingNumber: string;
      estimatedDeliveryDate?: string;
      itemName: string;
      shopName: string;
      comments?: string;
    }) => {
      console.log('Sending package data:', packageData);
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      queryClient.refetchQueries({ queryKey: ['/api/packages'] });
    },
  });
}

export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, adminComments }: { id: number; status: string; adminComments?: string }) => {
      console.log('Updating package status:', { id, status, adminComments });

      const response = await fetch(`/api/packages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, adminComments }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }));
        console.error('Error updating package status:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Package status updated successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: 'Успех',
        description: 'Статус посылки обновлен',
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить статус',
        variant: 'destructive',
      });
    },
  });
}

export function usePackageMessages(packageId: number) {
  return useQuery({
    queryKey: ['/api/packages', packageId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/packages/${packageId}/messages`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packageId,
      message,
    }: {
      packageId: number;
      message: string;
    }) => {
      const response = await apiRequest('POST', `/api/packages/${packageId}/messages`, {
        message,
      });
      return response.json();
    },
    onSuccess: (_, { packageId }) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/packages', packageId, 'messages'],
      });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packageId,
      file,
      fileType,
    }: {
      packageId: number;
      file: File;
      fileType: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch(`/api/packages/${packageId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to upload file');
      return response.json();
    },
    onSuccess: (_, { packageId }) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/packages', packageId, 'files'],
      });
    },
  });
}