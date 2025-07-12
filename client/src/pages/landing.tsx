import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Users, Shield, LogIn, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Landing() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ login, password }: { login: string; password: string }) => {
      return await apiRequest('POST', '/api/login', { login, password });
    },
    onSuccess: () => {
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему управления посылками!",
      });
      window.location.reload(); // Reload to update auth state
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка входа",
        description: error.message || "Неверный email или пароль",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ login, password });
  };

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Система управления посылками
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Профессиональная платформа для отслеживания и управления доставкой посылок
          </p>

          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Вход в систему</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login">Логин</Label>
                    <Input
                      id="login"
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Введите логин"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите пароль"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Вход..." : "Войти"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-white/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Тестовые учетные записи:</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Администратор:</span>
                  <span>admin / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span>Клиент:</span>
                  <span>client / 123456</span>
                </div>
                <div className="flex justify-between">
                  <span>Логист:</span>
                  <span>logist / 123456</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Package className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Управление посылками</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Полный контроль над жизненным циклом посылок с детальным отслеживанием
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Три роли</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Администратор, логист и клиент - каждый с уникальными возможностями
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Безопасность</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Защищенный доступ с авторизацией и контролем прав доступа
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Bell className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Уведомления</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Мгновенные уведомления о изменениях статуса посылок
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Создание посылки</h3>
              <p className="text-gray-600">
                Клиент выбирает логиста и заполняет форму с деталями посылки
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Обработка</h3>
              <p className="text-gray-600">
                Администратор координирует процесс между клиентом и логистом
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Доставка</h3>
              <p className="text-gray-600">
                Логист получает и отправляет посылку с подтверждением
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Готовы начать?
          </h2>
          <p className="text-gray-600 mb-6">
            Войдите в систему для доступа к панели управления
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary-dark text-white px-8 py-3 flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Войти в систему
              </Button>
            </Link>
            <p className="text-gray-600">
              Аккаунты создаются администратором
            </p>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Или используйте демо-доступ:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setLogin("admin"); setPassword("123456"); }}
              >
                Администратор
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setLogin("client"); setPassword("123456"); }}
              >
                Клиент
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setLogin("logist"); setPassword("123456"); }}
              >
                Логист
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Link href="/faq">
                <Button variant="link" className="text-sm text-gray-600 hover:text-primary">
                  Часто задаваемые вопросы
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}