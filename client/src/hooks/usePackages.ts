import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Package, PackageStatus } from "@/types";

export function usePackages(filters?: {
  status?: string;
  search?: string;
}) {
  const queryKey = ['/api/packages'];
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    queryKey.push(params.toString());
  }

  return useQuery<Package[]>({
    queryKey,
    queryFn: async () => {
      // Build URL with filters, but only include non-empty values and exclude 'all'
      const validFilters: Record<string, string> = {};
      if (filters?.status && filters.status !== 'all') validFilters.status = filters.status;
      if (filters?.search) validFilters.search = filters.search;
      
      const url = Object.keys(validFilters).length > 0 
        ? `/api/packages?${new URLSearchParams(validFilters).toString()}`
        : '/api/packages';
      
      console.log('Fetching packages from:', url);
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        console.error('Failed to fetch packages:', response.status, response.statusText);
        throw new Error(`Failed to fetch packages: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received packages:', data);
      return data;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 60000, // Refetch every minute
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

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminComments,
    }: {
      id: number;
      status: PackageStatus;
      adminComments?: string;
    }) => {
      const response = await apiRequest('PATCH', `/api/packages/${id}/status`, {
        status,
        adminComments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
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
