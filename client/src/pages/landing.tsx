import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, Shield, Bell } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
          <Button 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 text-lg"
          >
            Войти в систему
          </Button>
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
            onClick={handleLogin}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3"
          >
            Войти в систему
          </Button>
        </div>
      </div>
    </div>
  );
}
