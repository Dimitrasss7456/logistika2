import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { usePackage, useUploadFile, useCreateMessage } from "@/hooks/usePackages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CreditCard } from "lucide-react";

const paymentSchema = z.object({
  paymentConfirmation: z.string().min(1, "Обязательное поле"),
});

type PaymentData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: number | null;
}

export default function PaymentModal({
  open,
  onOpenChange,
  packageId,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadFile = useUploadFile();
  const createMessage = useCreateMessage();

  const { data: packageData } = usePackage(packageId || 0);

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentConfirmation: "",
    },
  });

  const onSubmit = async (data: PaymentData) => {
    if (!packageId) return;

    try {
      // Upload file if selected
      if (selectedFile) {
        await uploadFile.mutateAsync({
          packageId,
          file: selectedFile,
          fileType: "payment",
        });
      }

      // Create message with payment confirmation
      await createMessage.mutateAsync({
        packageId,
        message: `Оплата подтверждена: ${data.paymentConfirmation}`,
      });

      toast({
        title: "Успех",
        description: "Платеж подтвержден",
      });

      onOpenChange(false);
      form.reset();
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
        description: "Не удалось подтвердить платеж",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Оплата посылки
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {packageData && packageData.paymentAmount && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-800">
                  <strong>К оплате:</strong>{" "}
                  {(packageData.paymentAmount / 100).toFixed(2)} руб.
                </p>
                {packageData.paymentDetails && (
                  <p className="text-sm text-blue-600 mt-1">
                    {packageData.paymentDetails}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="paymentConfirmation">Подтверждение оплаты</Label>
            <Textarea
              id="paymentConfirmation"
              placeholder="Введите детали оплаты (номер транзакции, время оплаты и т.д.)..."
              {...form.register("paymentConfirmation")}
              className="mt-1"
            />
            {form.formState.errors.paymentConfirmation && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.paymentConfirmation.message}
              </p>
            )}
          </div>

          <div>
            <Label>Файл для отправки (при необходимости)</Label>
            <div
              className="border-2 border-dashed border-neutral-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer mt-1"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {selectedFile ? (
                <p className="text-sm text-gray-900">
                  Выбран файл: {selectedFile.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Нажмите для выбора файла или перетащите его сюда
                </p>
              )}
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-success hover:bg-green-600 text-white"
              disabled={uploadFile.isPending || createMessage.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {uploadFile.isPending || createMessage.isPending
                ? "Подтверждение..."
                : "Подтвердить оплату"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
