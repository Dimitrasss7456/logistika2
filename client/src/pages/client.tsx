import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePackages } from "@/hooks/usePackages";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Logist, Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, MessageCircle, Building, Box, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getStatusLabel, getStatusColor, canUserInteractWithStatus, CLIENT_STATUSES } from "@/utils/statusUtils";
import { useCreatePackage } from "@/hooks/usePackages";

export default function Client() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for package creation and interaction
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  const [selectedLogist, setSelectedLogist] = useState<Logist | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизованный доступ",
        description: "Вы не авторизованы. Перенаправляем на страницу входа...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Redirect if user is not client
  useEffect(() => {
    if (user && user.role !== 'client') {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);

  // Fetch logists and packages
  const { data: logists, isLoading: logistsLoading } = useQuery({
    queryKey: ["/api/logists"],
    enabled: !!user,
  });

  const { data: packages, isLoading: packagesLoading } = usePackages({
    clientId: user?.id,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  // Handle package creation
  const handleCreatePackage = (logist: Logist) => {
    setSelectedLogist(logist);
    setCreatePackageOpen(true);
  };

  // Handle package actions
  const handlePackageAction = (packageId: number, action: string) => {
    setSelectedPackageId(packageId);
    
    if (action === "confirm") {
      setFileUploadOpen(true);
    } else if (action === "payment") {
      setPaymentModalOpen(true);
    }
  };

  // Filter packages based on search and filters
  const filteredPackages = packages?.filter(pkg => {
    const matchesSearch = !searchTerm || 
      pkg.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || pkg.status === statusFilter;
    
    const matchesAddress = !addressFilter || 
      pkg.logist.location.toLowerCase().includes(addressFilter.toLowerCase()) ||
      pkg.logist.address.toLowerCase().includes(addressFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesAddress;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Личный кабинет клиента</h1>
          <p className="text-gray-600">Управляйте своими посылками и выбирайте логистов</p>
        </div>

        <Tabs defaultValue="logists" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logists">Логисты</TabsTrigger>
            <TabsTrigger value="packages">Мои посылки</TabsTrigger>
          </TabsList>

          <TabsContent value="logists" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Выберите логиста</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Поиск по адресу..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {logistsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Загрузка логистов...</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {logists?.map((logist: Logist) => (
                    <Card key={logist.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{logist.user.firstName} {logist.user.lastName}</CardTitle>
                          <Badge variant={logist.isActive ? "default" : "secondary"}>
                            {logist.isActive ? "Активен" : "Неактивен"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{logist.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{logist.address}</span>
                          </div>
                          <div className="flex gap-2">
                            {logist.supportsLockers && (
                              <Badge variant="outline">Локеры</Badge>
                            )}
                            {logist.supportsOffices && (
                              <Badge variant="outline">Отделения</Badge>
                            )}
                          </div>
                          <Button 
                            onClick={() => handleCreatePackage(logist)}
                            className="w-full"
                            disabled={!logist.isActive}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Создать посылку
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Мои посылки</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Поиск по номеру, названию..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Фильтр по статусу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все статусы</SelectItem>
                      {Object.entries(CLIENT_STATUSES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={addressFilter} onValueChange={setAddressFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Фильтр по адресу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все адреса</SelectItem>
                      {logists?.map((logist: Logist) => (
                        <SelectItem key={logist.id} value={logist.location}>
                          {logist.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {packagesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Загрузка посылок...</p>
                </div>
              ) : filteredPackages?.length === 0 ? (
                <div className="text-center py-12">
                  <Box className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Посылок не найдено</h3>
                  <p className="text-gray-600">Создайте свою первую посылку, выбрав логиста</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPackages?.map((pkg: Package) => (
                    <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">#{pkg.uniqueNumber}</CardTitle>
                          <Badge className={getStatusColor(pkg.status)}>
                            {getStatusLabel(pkg.status, "client")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Товар:</span>
                              <span className="text-sm text-gray-600">{pkg.itemName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Магазин:</span>
                              <span className="text-sm text-gray-600">{pkg.shopName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Получатель:</span>
                              <span className="text-sm text-gray-600">{pkg.recipientName}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Логист:</span>
                              <span className="text-sm text-gray-600">{pkg.logist.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Трекинг:</span>
                              <span className="text-sm text-gray-600">{pkg.trackingNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">Доставка:</span>
                              <span className="text-sm text-gray-600">
                                {pkg.deliveryType === "locker" ? "Локер" : "Адрес"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {canUserInteractWithStatus(pkg.status, "client") && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                              {pkg.status === "received_by_logist" && (
                                <Button
                                  onClick={() => handlePackageAction(pkg.id, "confirm")}
                                  className="flex-1"
                                >
                                  Подтвердить и загрузить файл
                                </Button>
                              )}
                              {pkg.status === "awaiting_payment" && (
                                <Button
                                  onClick={() => handlePackageAction(pkg.id, "payment")}
                                  className="flex-1"
                                >
                                  Оплатить
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Package Modal */}
      <CreatePackageDialog 
        open={createPackageOpen}
        onOpenChange={setCreatePackageOpen}
        logist={selectedLogist}
      />

      {/* Payment Modal */}
      <PaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        packageId={selectedPackageId}
      />

      {/* File Upload Modal */}
      <FileUploadDialog
        open={fileUploadOpen}
        onOpenChange={setFileUploadOpen}
        packageId={selectedPackageId}
      />
    </div>
  );
}

// Create Package Dialog Component
function CreatePackageDialog({ open, onOpenChange, logist }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logist: Logist | null;
}) {
  const { toast } = useToast();
  const createPackage = useCreatePackage();
  const [formData, setFormData] = useState({
    telegramUsername: '',
    recipientName: '',
    deliveryType: 'locker' as 'locker' | 'address',
    lockerAddress: '',
    lockerCode: '',
    courierService: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
    itemName: '',
    shopName: '',
    comments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logist) return;

    try {
      await createPackage.mutateAsync({
        ...formData,
        logistId: logist.id,
        status: 'created'
      });
      
      toast({
        title: "Успех",
        description: "Посылка создана успешно",
      });
      
      onOpenChange(false);
      setFormData({
        telegramUsername: '',
        recipientName: '',
        deliveryType: 'locker',
        lockerAddress: '',
        lockerCode: '',
        courierService: '',
        trackingNumber: '',
        estimatedDeliveryDate: '',
        itemName: '',
        shopName: '',
        comments: ''
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать посылку",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать посылку</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telegramUsername">Telegram Username</Label>
              <Input
                id="telegramUsername"
                value={formData.telegramUsername}
                onChange={(e) => setFormData({...formData, telegramUsername: e.target.value})}
                placeholder="@username"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="recipientName">Имя получателя</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label>Доставка</Label>
            <RadioGroup
              value={formData.deliveryType}
              onValueChange={(value) => setFormData({...formData, deliveryType: value as 'locker' | 'address'})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="locker" id="locker" />
                <Label htmlFor="locker">Локер</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="address" id="address" />
                <Label htmlFor="address">Адрес</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.deliveryType === 'locker' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lockerAddress">Адрес локера</Label>
                <Input
                  id="lockerAddress"
                  value={formData.lockerAddress}
                  onChange={(e) => setFormData({...formData, lockerAddress: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="lockerCode">Код локера</Label>
                <Input
                  id="lockerCode"
                  value={formData.lockerCode}
                  onChange={(e) => setFormData({...formData, lockerCode: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courierService">Курьерская служба</Label>
              <Input
                id="courierService"
                value={formData.courierService}
                onChange={(e) => setFormData({...formData, courierService: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="trackingNumber">Трекинг номер</Label>
              <Input
                id="trackingNumber"
                value={formData.trackingNumber}
                onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedDeliveryDate">Приблизительная дата доставки</Label>
            <Input
              id="estimatedDeliveryDate"
              type="date"
              value={formData.estimatedDeliveryDate}
              onChange={(e) => setFormData({...formData, estimatedDeliveryDate: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemName">Название товара</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="shopName">Магазин</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Дополнительные комментарии</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={createPackage.isPending}>
              {createPackage.isPending ? "Создание..." : "Создать посылку"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Payment Dialog Component
function PaymentDialog({ open, onOpenChange, packageId }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number | null;
}) {
  const { toast } = useToast();
  const [paymentDetails, setPaymentDetails] = useState('');

  const handlePayment = async () => {
    if (!packageId) return;

    try {
      // TODO: Implement payment logic
      toast({
        title: "Успех",
        description: "Оплата подтверждена",
      });
      
      onOpenChange(false);
      setPaymentDetails('');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать оплату",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Оплата посылки</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentDetails">Детали оплаты</Label>
            <Textarea
              id="paymentDetails"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder="Введите детали оплаты..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handlePayment} className="flex-1">
              Подтвердить оплату
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// File Upload Dialog Component
function FileUploadDialog({ open, onOpenChange, packageId }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number | null;
}) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async () => {
    if (!packageId || !selectedFile) return;

    try {
      // TODO: Implement file upload logic
      toast({
        title: "Успех",
        description: "Файл загружен успешно",
      });
      
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузка файла</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Выберите файл</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleFileUpload} className="flex-1" disabled={!selectedFile}>
              Загрузить файл
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}