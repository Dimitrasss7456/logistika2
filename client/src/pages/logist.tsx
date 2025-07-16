import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, useUpdatePackageStatus } from "@/hooks/usePackages";
import { useUploadFile } from "@/hooks/usePackages";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Upload, CheckCircle, Camera, FileText, Search, Eye } from "lucide-react";
import { Package as PackageType } from "@/types";
import { getStatusLabel, getStatusColor, canUserInteractWithStatus, LOGIST_STATUSES } from "@/utils/statusUtils";

export default function Logist() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (user && user.role !== 'logist') {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);
  
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'receipt' | 'shipping'>('receipt');
  
  const updatePackageStatus = useUpdatePackageStatus();
  
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
    }
  }, [isAuthenticated, isLoading, toast]);

  // Get packages for this logist
  const { data: packages, isLoading: packagesLoading, error: packagesError } = usePackages({
    logistId: user?.id ? parseInt(user.id) : undefined,
    search: searchTerm || undefined,
  });

  // Handle authentication errors
  useEffect(() => {
    if (packagesError && isUnauthorizedError(packagesError)) {
      toast({
        title: "Сессия истекла",
        description: "Пожалуйста, войдите снова",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [packagesError, toast]);

  const handlePackageAction = (packageId: number, action: 'confirm_receipt' | 'confirm_shipping') => {
    setSelectedPackageId(packageId);
    setUploadType(action === 'confirm_receipt' ? 'receipt' : 'shipping');
    setUploadDialogOpen(true);
  };

  const handleStatusUpdate = (id: number, newStatus: string) => {
    updatePackageStatus.mutate({
      id,
      status: newStatus,
    });
  };

  // Filter packages for logist view
  const filteredPackages = packages?.filter((pkg: PackageType) => {
    const matchesSearch = !searchTerm || 
      pkg.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Личный кабинет логиста</h1>
          <p className="text-gray-600">Управляйте получением и отправкой посылок</p>
        </div>

        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по номеру, товару или получателю..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages List */}
          {packagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка посылок...</p>
            </div>
          ) : filteredPackages?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Посылок не найдено</h3>
              <p className="text-gray-600">Пока нет посылок для обработки</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPackages?.map((pkg: PackageType) => (
                <LogistPackageCard
                  key={pkg.id}
                  package={pkg}
                  onAction={handlePackageAction}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        packageId={selectedPackageId}
        uploadType={uploadType}
      />
    </div>
  );
}

function LogistPackageCard({ package: pkg, onAction, onStatusUpdate }: {
  package: PackageType;
  onAction: (packageId: number, action: 'confirm_receipt' | 'confirm_shipping') => void;
  onStatusUpdate: (id: number, status: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const canInteract = canUserInteractWithStatus(pkg.status, "logist");
  const needsReceiptConfirmation = pkg.status === "sent_to_logist";
  const needsShippingConfirmation = pkg.status === "awaiting_shipping";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">#{pkg.uniqueNumber}</CardTitle>
            <Badge className={getStatusColor(pkg.status)}>
              {getStatusLabel(pkg.status, "logist")}
            </Badge>
            {canInteract && (
              <Badge variant="outline">
                Требует действий
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Info - Always visible */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Получатель:</span> {pkg.recipientName}
            </div>
            <div>
              <span className="font-medium">Telegram:</span> {pkg.telegramUsername}
            </div>
            <div>
              <span className="font-medium">Доставка:</span> {pkg.deliveryType === "locker" ? "Локер" : "Адрес"}
            </div>
            <div>
              <span className="font-medium">Дата создания:</span> {new Date(pkg.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Detailed Info - Only if package is sent to logist or later */}
          {(pkg.status !== "created" && showDetails) && (
            <div className="pt-4 border-t space-y-2 text-sm">
              <div><span className="font-medium">Товар:</span> {pkg.itemName}</div>
              <div><span className="font-medium">Магазин:</span> {pkg.shopName}</div>
              <div><span className="font-medium">Трекинг:</span> {pkg.trackingNumber}</div>
              <div><span className="font-medium">Курьер:</span> {pkg.courierService}</div>
              {pkg.deliveryType === "locker" && (
                <>
                  <div><span className="font-medium">Адрес локера:</span> {pkg.lockerAddress}</div>
                  <div><span className="font-medium">Код локера:</span> {pkg.lockerCode}</div>
                </>
              )}
              {pkg.estimatedDeliveryDate && (
                <div><span className="font-medium">Ожидаемая дата:</span> {new Date(pkg.estimatedDeliveryDate).toLocaleDateString()}</div>
              )}
              {pkg.comments && (
                <div><span className="font-medium">Комментарии:</span> {pkg.comments}</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {canInteract && (
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                {needsReceiptConfirmation && (
                  <Button
                    onClick={() => onStatusUpdate(pkg.id, 'received_by_logist')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Посылка получена
                  </Button>
                )}
                {needsShippingConfirmation && (
                  <Button
                    onClick={() => onAction(pkg.id, 'confirm_shipping')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Подтвердить отправку
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FileUploadDialog({ open, onOpenChange, packageId, uploadType }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number | null;
  uploadType: 'receipt' | 'shipping';
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const uploadFile = useUploadFile();
  const updatePackageStatus = useUpdatePackageStatus();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !packageId) return;

    setUploading(true);
    try {
      await uploadFile.mutateAsync({
        file,
        packageId,
        fileType: uploadType === 'receipt' ? 'proof' : 'shipping'
      });

      // Update package status
      const newStatus = uploadType === 'receipt' ? 'received_by_logist' : 'shipped';
      await updatePackageStatus.mutateAsync({
        id: packageId,
        status: newStatus
      });

      toast({
        title: "Успех",
        description: `Файл загружен и статус обновлен`,
      });

      onOpenChange(false);
      setFile(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {uploadType === 'receipt' 
              ? 'Подтверждение получения посылки'
              : 'Подтверждение отправки посылки'
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">
              {uploadType === 'receipt' 
                ? 'Загрузите фото/видео доказательство получения'
                : 'Загрузите фото/видео доказательство отправки'
              }
            </Label>
            <Input
              id="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="mt-2"
            />
          </div>

          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Выбранный файл:</span> {file.name}
              </p>
              <p className="text-xs text-gray-600">
                Размер: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Загрузка...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Подтвердить
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}