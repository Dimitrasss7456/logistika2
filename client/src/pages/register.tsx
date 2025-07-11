import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Package, User, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  lastName: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
  role: z.enum(["client", "logist"]),
  telegramUsername: z.string().optional(),
  // Logist-specific fields
  location: z.string().optional(),
  address: z.string().optional(),
  supportsLockers: z.boolean().default(false),
  supportsOffices: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "logist") {
    return data.location && data.address;
  }
  return true;
}, {
  message: "Заполните все обязательные поля для логиста",
  path: ["location"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "client",
      supportsLockers: false,
      supportsOffices: false,
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка регистрации");
      }

      toast({
        title: "Регистрация успешна",
        description: "Ваш аккаунт создан. Теперь вы можете войти в систему.",
      });

      navigate("/login");
    } catch (error) {
      toast({
        title: "Ошибка регистрации",
        description: error instanceof Error ? error.message : "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Регистрация
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Создайте аккаунт для управления посылками
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Создать аккаунт</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="your@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      placeholder="Имя"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      placeholder="Фамилия"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="telegramUsername">Telegram Username (необязательно)</Label>
                  <Input
                    id="telegramUsername"
                    {...form.register("telegramUsername")}
                    placeholder="@username"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Роль</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => form.setValue("role", value as "client" | "logist")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Клиент
                        </div>
                      </SelectItem>
                      <SelectItem value="logist">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Логист
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole === "logist" && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900">Информация для логиста</h3>
                    
                    <div>
                      <Label htmlFor="location">Город/Локация</Label>
                      <Input
                        id="location"
                        {...form.register("location")}
                        placeholder="Москва"
                      />
                      {form.formState.errors.location && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.location.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address">Адрес</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        placeholder="Полный адрес"
                      />
                      {form.formState.errors.address && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Типы доставки</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="supportsLockers"
                          checked={form.watch("supportsLockers")}
                          onCheckedChange={(checked) =>
                            form.setValue("supportsLockers", checked as boolean)
                          }
                        />
                        <Label htmlFor="supportsLockers" className="text-sm">
                          Поддерживаю локеры
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="supportsOffices"
                          checked={form.watch("supportsOffices")}
                          onCheckedChange={(checked) =>
                            form.setValue("supportsOffices", checked as boolean)
                          }
                        />
                        <Label htmlFor="supportsOffices" className="text-sm">
                          Поддерживаю отделения
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    placeholder="Минимум 6 символов"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register("confirmPassword")}
                    placeholder="Повторите пароль"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Создание аккаунта..." : "Создать аккаунт"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-primary hover:text-primary-dark">
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}