import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useUploadFile, useUpdatePackageStatus } from "@/hooks/usePackages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, Package } from "lucide-react";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number | null;
  fileType: 'proof' | 'shipping';
}

export default function FileUploadModal({
  open,
  onOpenChange,
  packageId,
  fileType,
}: FileUploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadFile = useUploadFile();
  const updatePackageStatus = useUpdatePackageStatus();

  const title = fileType === 'proof' 
    ? 'Подтверждение получения посылки'
    : 'Подтверждение отправки посылки';

  const description = fileType === 'proof'
    ? 'Загрузите фото или видео подтверждение получения посылки'
    : 'Загрузите фото или видео подтверждение отправки посылки';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Ошибка",
          description: "Разрешены только изображения и видео файлы",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 50MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!packageId || !selectedFile) {
      toast({
        title: "Ошибка",
        description: "Выберите файл для загрузки",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file
      await uploadFile.mutateAsync({
        packageId,
        file: selectedFile,
        fileType,
      });

      // Update package status based on file type
      const newStatus = fileType === 'proof' 
        ? 'package_received' 
        : 'sent_logist';

      await updatePackageStatus.mutateAsync({
        id: packageId,
        status: newStatus as any,
      });

      toast({
        title: "Успех",
        description: fileType === 'proof' 
          ? "Получение посылки подтверждено"
          : "Отправка посылки подтверждена",
      });

      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
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
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {fileType === 'proof' ? (
              <Package className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-gray-600">{description}</p>

          <div>
            <Label>Выберите файл</Label>
            <div
              className="border-2 border-dashed border-neutral-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer mt-2"
              onClick={() => document.getElementById("proof-file-input")?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Нажмите для выбора файла или перетащите его сюда
                  </p>
                  <p className="text-xs text-gray-500">
                    Поддерживаются: JPG, PNG, GIF, MP4, MOV, AVI (до 50MB)
                  </p>
                </div>
              )}
              <input
                id="proof-file-input"
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedFile(null);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-success hover:bg-green-600 text-white"
              disabled={!selectedFile || uploadFile.isPending || updatePackageStatus.isPending}
            >
              {fileType === 'proof' ? (
                <Package className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {uploadFile.isPending || updatePackageStatus.isPending
                ? "Загрузка..."
                : fileType === 'proof' 
                  ? "Подтвердить получение"
                  : "Подтвердить отправку"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
