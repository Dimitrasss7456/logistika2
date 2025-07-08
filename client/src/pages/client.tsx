import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Logist, Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, MessageCircle, Building, Box, Plus } from "lucide-react";
import CreatePackageModal from "@/components/modals/create-package-modal";
import PaymentModal from "@/components/modals/payment-modal";
import { usePackages } from "@/hooks/usePackages";
import PackageCard from "@/components/package/package-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Client() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [selectedLogist, setSelectedLogist] = useState<Logist | null>(null);
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизованный доступ",
        description: "Вы не авторизованы. Выполняется вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: logists, isLoading: logistsLoading } = useQuery<Logist[]>({
    queryKey: ['/api/logists'],
    queryFn: async () => {
      const response = await fetch('/api/logists', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch logists');
      return response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Неавторизованный доступ",
          description: "Вы не авторизованы. Выполняется вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список логистов",
        variant: "destructive",
      });
    },
  });

  const { data: packages, isLoading: packagesLoading } = usePackages({
    status: statusFilter,
    search: searchTerm,
  });

  const handleCreatePackage = (logist: Logist) => {
    setSelectedLogist(logist);
    setCreatePackageOpen(true);
  };

  const handlePayment = (packageId: number) => {
    setSelectedPackageId(packageId);
    setPaymentModalOpen(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'created_client': 'Создана',
      'client_received': 'Получена логистом',
      'awaiting_processing_client': 'Ожидает обработки',
      'awaiting_payment_client': 'Ожидает оплаты',
      'awaiting_shipping_client': 'Ожидает отправки',
      'sent_client': 'Отправлена',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'created_client': 'bg-blue-100 text-blue-800',
      'client_received': 'bg-green-100 text-green-800',
      'awaiting_processing_client': 'bg-yellow-100 text-yellow-800',
      'awaiting_payment_client': 'bg-orange-100 text-orange-800',
      'awaiting_shipping_client': 'bg-purple-100 text-purple-800',
      'sent_client': 'bg-emerald-100 text-emerald-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="logists" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logists" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Логисты
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Мои посылки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logists" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Выберите логиста</h2>
              <p className="text-gray-600">Выберите логиста для создания новой посылки</p>
            </div>

            {logistsLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {logists?.map((logist) => (
                  <Card key={logist.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 mb-2">
                            {logist.location}
                          </CardTitle>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{logist.address}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{logist.user.email}</span>
                            </div>
                            {logist.user.telegramUsername && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{logist.user.telegramUsername}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge className="bg-success text-white">
                            Активен
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {logist.supportsOffices && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            <Building className="h-3 w-3 mr-1" />
                            Отделения
                          </Badge>
                        )}
                        {logist.supportsLockers && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <Box className="h-3 w-3 mr-1" />
                            Локеры
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => handleCreatePackage(logist)}
                        className="w-full bg-primary hover:bg-primary-dark text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Создать посылку
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Мои посылки</h2>
              <p className="text-gray-600">Отслеживайте статус ваших посылок</p>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Поиск по номеру посылки..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все статусы</SelectItem>
                      <SelectItem value="created_client">Создана</SelectItem>
                      <SelectItem value="client_received">Получена логистом</SelectItem>
                      <SelectItem value="awaiting_processing_client">Ожидает обработки</SelectItem>
                      <SelectItem value="awaiting_payment_client">Ожидает оплаты</SelectItem>
                      <SelectItem value="awaiting_shipping_client">Ожидает отправки</SelectItem>
                      <SelectItem value="sent_client">Отправлена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Packages List */}
            {packagesLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : packages?.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Box className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">У вас пока нет посылок</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Создайте первую посылку на вкладке "Логисты"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {packages?.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    package={pkg}
                    onPayment={handlePayment}
                    getStatusText={getStatusText}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreatePackageModal
          open={createPackageOpen}
          onOpenChange={setCreatePackageOpen}
          logist={selectedLogist}
        />

        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          packageId={selectedPackageId}
        />
      </div>
    </div>
  );
}
