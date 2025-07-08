import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logist } from "@/types";
import { useCreatePackage } from "@/hooks/usePackages";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const createPackageSchema = z.object({
  telegramUsername: z.string().min(1, "Обязательное поле").startsWith("@", "Должно начинаться с @"),
  recipientName: z.string().min(1, "Обязательное поле"),
  deliveryType: z.enum(["locker", "address"], {
    required_error: "Выберите тип доставки",
  }),
  lockerAddress: z.string().optional(),
  lockerCode: z.string().optional(),
  courierService: z.string().min(1, "Обязательное поле"),
  trackingNumber: z.string().min(1, "Обязательное поле"),
  estimatedDeliveryDate: z.date().optional(),
  itemName: z.string().min(1, "Обязательное поле"),
  shopName: z.string().min(1, "Обязательное поле"),
  comments: z.string().optional(),
});

type CreatePackageData = z.infer<typeof createPackageSchema>;

interface CreatePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logist: Logist | null;
}

export default function CreatePackageModal({
  open,
  onOpenChange,
  logist,
}: CreatePackageModalProps) {
  const { toast } = useToast();
  const createPackage = useCreatePackage();
  const [deliveryType, setDeliveryType] = useState<"locker" | "address" | "">("");
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<CreatePackageData>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      telegramUsername: "",
      recipientName: "",
      deliveryType: undefined,
      lockerAddress: "",
      lockerCode: "",
      courierService: "",
      trackingNumber: "",
      itemName: "",
      shopName: "",
      comments: "",
    },
  });

  const onSubmit = async (data: CreatePackageData) => {
    if (!logist) {
      toast({
        title: "Ошибка",
        description: "Логист не выбран",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPackage.mutateAsync({
        ...data,
        logistId: logist.id,
        estimatedDeliveryDate: data.estimatedDeliveryDate?.toISOString(),
      });

      toast({
        title: "Успех",
        description: "Посылка создана успешно",
      });

      onOpenChange(false);
      form.reset();
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
        description: "Не удалось создать посылку",
        variant: "destructive",
      });
    }
  };

  const handleDeliveryTypeChange = (value: string) => {
    setDeliveryType(value as "locker" | "address");
    form.setValue("deliveryType", value as "locker" | "address");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать посылку</DialogTitle>
          {logist && (
            <p className="text-sm text-gray-600">
              Логист: {logist.location} - {logist.address}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="telegramUsername">ТГ юзернейм</Label>
              <Input
                id="telegramUsername"
                placeholder="@username"
                {...form.register("telegramUsername")}
              />
              {form.formState.errors.telegramUsername && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.telegramUsername.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="recipientName">Имя получателя</Label>
              <Input
                id="recipientName"
                placeholder="Введите имя получателя"
                {...form.register("recipientName")}
              />
              {form.formState.errors.recipientName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.recipientName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deliveryType">Доставка на</Label>
              <Select value={deliveryType} onValueChange={handleDeliveryTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип доставки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locker">Локер</SelectItem>
                  <SelectItem value="address">Адрес</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.deliveryType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.deliveryType.message}
                </p>
              )}
            </div>

            {deliveryType === "locker" && (
              <>
                <div>
                  <Label htmlFor="lockerAddress">Адрес локера</Label>
                  <Input
                    id="lockerAddress"
                    placeholder="Адрес локера"
                    {...form.register("lockerAddress")}
                  />
                </div>

                <div>
                  <Label htmlFor="lockerCode">Код локера</Label>
                  <Input
                    id="lockerCode"
                    placeholder="Код локера"
                    {...form.register("lockerCode")}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="courierService">Курьерская служба</Label>
              <Input
                id="courierService"
                placeholder="Название курьерской службы"
                {...form.register("courierService")}
              />
              {form.formState.errors.courierService && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.courierService.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="trackingNumber">Трекинг номер</Label>
              <Input
                id="trackingNumber"
                placeholder="Номер отслеживания"
                {...form.register("trackingNumber")}
              />
              {form.formState.errors.trackingNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.trackingNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label>Приблизительная дата доставки</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("estimatedDeliveryDate") ? (
                      format(form.watch("estimatedDeliveryDate")!, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("estimatedDeliveryDate")}
                    onSelect={(date) => {
                      form.setValue("estimatedDeliveryDate", date);
                      setDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="itemName">Название товара</Label>
              <Input
                id="itemName"
                placeholder="Описание товара"
                {...form.register("itemName")}
              />
              {form.formState.errors.itemName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.itemName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shopName">Магазин</Label>
              <Input
                id="shopName"
                placeholder="Откуда заказан товар"
                {...form.register("shopName")}
              />
              {form.formState.errors.shopName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.shopName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Дополнительные комментарии</Label>
            <Textarea
              id="comments"
              placeholder="Дополнительная информация..."
              {...form.register("comments")}
            />
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
              className="bg-primary hover:bg-primary-dark"
              disabled={createPackage.isPending}
            >
              {createPackage.isPending ? "Создание..." : "Создать посылку"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
