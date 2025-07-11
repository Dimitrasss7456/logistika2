import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import { Link, useLocation } from "wouter";

const loginSchema = z.object({
  login: z.string().min(1, "Логин обязателен").regex(/^[a-zA-Z0-9_-]+$/, "Логин может содержать только буквы, цифры, дефисы и подчеркивания"),
  password: z.string().min(1, "Пароль обязателен"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка входа");
      }

      const result = await response.json();

      toast({
        title: "Вход выполнен",
        description: "Добро пожаловать в систему!",
      });

      // Redirect based on role
      if (result.user.role === "admin") {
        navigate("/admin");
      } else if (result.user.role === "manager") {
        navigate("/manager");
      } else if (result.user.role === "logist") {
        navigate("/logist");
      } else {
        navigate("/client");
      }
    } catch (error) {
      toast({
        title: "Ошибка входа",
        description: error instanceof Error ? error.message : "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: "admin" | "manager" | "client" | "logist") => {
    const demoCredentials = {
      admin: { login: "admin", password: "123456" },
      manager: { login: "manager", password: "123456" },
      client: { login: "client", password: "123456" },
      logist: { login: "logist", password: "123456" },
    };

    form.setValue("login", demoCredentials[role].login);
    form.setValue("password", demoCredentials[role].password);
    form.handleSubmit(onSubmit)();
  };

  const handlePasswordReset = async () => {
    const login = form.getValues("login");
    if (!login) {
      toast({
        title: "Ошибка",
        description: "Введите логин для сброса пароля",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка запроса сброса пароля");
      }

      toast({
        title: "Запрос отправлен",
        description: "Администратор получил уведомление и свяжется с вами в Telegram",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Введите логин и пароль для входа в систему
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  type="text"
                  autoComplete="username"
                  {...form.register("login")}
                  placeholder="Введите логин (например: admin)"
                />
                {form.formState.errors.login && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.login.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...form.register("password")}
                  placeholder="Ваш пароль (например: 123456)"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Быстрый вход</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("admin")}
                  className="w-full"
                  disabled={isLoading}
                >
                  Войти как Администратор (admin/123456)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("manager")}
                  className="w-full"
                  disabled={isLoading}
                >
                  Войти как Менеджер (manager/123456)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("client")}
                  className="w-full"
                  disabled={isLoading}
                >
                  Войти как Клиент (client/123456)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("logist")}
                  className="w-full"
                  disabled={isLoading}
                >
                  Войти как Логист (logist/123456)
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-primary hover:text-primary-dark text-sm"
              >
                Восстановить доступ
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Запрос будет отправлен администратору
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}