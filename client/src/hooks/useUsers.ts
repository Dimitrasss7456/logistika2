import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['/api/users', role],
    queryFn: async () => {
      const url = role ? `/api/users?role=${role}` : '/api/users';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Успех',
        description: 'Роль пользователя успешно обновлена',
      });
    },
    onError: (error: any) => {
      console.error('Update user role error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить роль пользователя',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleUserAccess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest('PUT', `/api/users/${userId}/access`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Успех',
        description: 'Доступ пользователя успешно обновлен',
      });
    },
    onError: (error: any) => {
      console.error('Toggle user access error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить доступ пользователя',
        variant: 'destructive',
      });
    },
  });
}

export function useLogists() {
  return useQuery({
    queryKey: ['/api/logists'],
    queryFn: async () => {
      const response = await fetch('/api/logists');
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useCreateLogist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (logistData: any) => {
      await apiRequest('/api/logists', {
        method: 'POST',
        body: JSON.stringify(logistData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logists'] });
      toast({
        title: 'Успех',
        description: 'Логист успешно создан',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать логиста',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLogist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...logistData }: { id: number } & any) => {
      await apiRequest(`/api/logists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(logistData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logists'] });
      toast({
        title: 'Успех',
        description: 'Логист успешно обновлен',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить логиста',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUserCredentials() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ userId, login, password }: { userId: string; login?: string; password?: string }) => {
      return apiRequest('PUT', `/api/users/${userId}/credentials`, { login, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Успех',
        description: 'Данные пользователя успешно обновлены',
      });
    },
    onError: (error: any) => {
      console.error('Update user credentials error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные пользователя',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (userId: string) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logists'] });
      toast({
        title: 'Успех',
        description: 'Пользователь удален',
      });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить пользователя',
        variant: 'destructive',
      });
    },
  });
}