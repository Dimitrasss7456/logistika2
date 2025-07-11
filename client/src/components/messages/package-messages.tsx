import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: number;
  packageId: number;
  senderId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string;
  };
}

interface PackageMessagesProps {
  packageId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PackageMessages({ packageId, open, onOpenChange }: PackageMessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/packages/${packageId}/messages`],
    enabled: open && !!packageId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('POST', `/api/packages/${packageId}/messages`, {
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}/messages`] });
      setNewMessage("");
      toast({
        title: "Сообщение отправлено",
        description: "Ваше сообщение было успешно отправлено.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUserInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (sender: Message['sender']) => {
    if (sender.firstName && sender.lastName) {
      return `${sender.firstName} ${sender.lastName}`;
    }
    if (sender.firstName) {
      return sender.firstName;
    }
    return sender.email || "Пользователь";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'logist': return 'bg-blue-500';
      case 'client': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!open) return null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Сообщения по посылке #{packageId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-80 w-full pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Пока нет сообщений</p>
              <p className="text-sm">Начните общение, отправив первое сообщение</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.senderId !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${getRoleColor(message.sender.role)} text-white text-xs`}>
                        {getUserInitials(message.sender.firstName, message.sender.lastName, message.sender.email)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${
                    message.senderId === user?.id ? 'order-first' : ''
                  }`}>
                    <div className={`rounded-lg p-3 ${
                      message.senderId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {getUserDisplayName(message.sender)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {message.senderId === user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${getRoleColor(user.role)} text-white text-xs`}>
                        {getUserInitials(user.firstName, user.lastName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}