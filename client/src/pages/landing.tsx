import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Users, Shield, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await apiRequest('/api/login', 'POST', { email, password });
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
    if (!email || !password) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@package.ru"
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
              <h3 className="font-semibold mb-2">Тестовые учетные записи:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Администратор:</strong> admin@package.ru / admin123</div>
                <div><strong>Логист:</strong> logist@package.ru / logist123</div>
                <div><strong>Клиент:</strong> client@package.ru / client123</div>
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
            Войдите в систему, чтобы получить доступ к вашей панели управления
          </p>
          <Button 
            onClick={() => window.scrollTo({ top: 60, behavior: 'smooth' })}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3"
          >
            Войти в систему
          </Button>
        </div>
      </div>
    </div>
  );
}
