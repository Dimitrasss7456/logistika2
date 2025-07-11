import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  const faqItems = [
    {
      question: "Как создать посылку?",
      answer: "Зайдите в раздел «Логисты», выберите подходящего логиста по местоположению и типу доставки, затем нажмите «Создать посылку» и заполните все необходимые поля."
    },
    {
      question: "Что означают статусы посылок?",
      answer: "Статусы показывают текущее состояние посылки: Создана → Получена логистом → Ожидает обработки → Ожидает оплаты → Ожидает отправки → Отправлена. Каждый статус означает определенный этап в процессе доставки."
    },
    {
      question: "Как оплатить посылку?",
      answer: "Когда посылка перейдет в статус «Ожидает оплаты», вы получите уведомление с реквизитами для оплаты. После оплаты загрузите подтверждение и нажмите «Оплачено»."
    },
    {
      question: "Какие документы нужны для отправки?",
      answer: "Для отправки посылки может потребоваться: фото товара, документы подтверждения покупки, специальные файлы для логиста. Все необходимые документы указываются в процессе создания посылки."
    },
    {
      question: "Как отследить посылку?",
      answer: "В разделе «Мои посылки» вы можете видеть текущий статус каждой посылки, прогресс доставки и всю историю изменений. Также приходят уведомления при смене статуса."
    },
    {
      question: "Что делать, если посылка задерживается?",
      answer: "Если посылка долго находится в одном статусе, свяжитесь с поддержкой через Telegram или опишите проблему в чате к конкретной посылке."
    },
    {
      question: "Как работает система логистов?",
      answer: "Логисты - это партнеры, которые помогают с получением и отправкой посылок в разных городах. Каждый логист указывает свои возможности: работа с локерами, отделениями, география работы."
    },
    {
      question: "Можно ли изменить данные посылки?",
      answer: "После создания посылки некоторые данные можно изменить только через администратора. Обратитесь в поддержку для внесения изменений."
    },
    {
      question: "Как получить уведомления?",
      answer: "Уведомления приходят автоматически при смене статуса посылки. Проверьте раздел уведомлений (значок колокольчика) для просмотра всех сообщений."
    },
    {
      question: "Что делать при проблемах с доставкой?",
      answer: "При любых проблемах сразу свяжитесь с поддержкой через Telegram. Также можете оставить сообщение в чате конкретной посылки."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Часто задаваемые вопросы
          </h1>
          <p className="text-gray-600">
            Ответы на самые популярные вопросы о работе с системой управления посылками
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Нужна помощь?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Не нашли ответ на свой вопрос? Свяжитесь с нашей службой поддержки
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://t.me/support', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Написать в Telegram
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вопросы и ответы</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}