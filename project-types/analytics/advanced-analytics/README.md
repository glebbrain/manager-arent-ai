# Advanced Analytics System

Система расширенной аналитики для Universal Automation Platform, предоставляющая бизнес-аналитику и расширенную отчетность.

## Возможности

### Основные функции
- **Аналитический движок**: Обработка и анализ данных в реальном времени
- **Генератор отчетов**: Создание отчетов в различных форматах
- **Менеджер дашбордов**: Управление интерактивными дашбордами
- **Калькулятор KPI**: Расчет ключевых показателей эффективности
- **Визуализатор данных**: Создание графиков и диаграмм
- **Движок инсайтов**: Автоматическое выявление паттернов и аномалий
- **Менеджер уведомлений**: Система оповещений и алертов
- **Сервис экспорта**: Экспорт данных в различных форматах

### Типы аналитики
- **Описательная аналитика**: Что произошло
- **Диагностическая аналитика**: Почему это произошло
- **Предиктивная аналитика**: Что может произойти
- **Пресcriptive аналитика**: Что нужно делать

## Архитектура

### Микросервисы
- **analytics-engine**: Основной движок аналитики
- **report-generator**: Генерация отчетов
- **dashboard-manager**: Управление дашбордами
- **kpi-calculator**: Расчет KPI
- **data-visualizer**: Визуализация данных
- **insight-engine**: Генерация инсайтов
- **alert-manager**: Управление уведомлениями
- **export-service**: Экспорт данных

### API Endpoints

#### Analytics
- `POST /api/analytics/process` - Обработка данных
- `GET /api/analytics/metrics` - Получение метрик
- `GET /api/analytics/realtime` - Данные в реальном времени
- `DELETE /api/analytics/clear` - Очистка старых данных

#### Reports
- `POST /api/reports/generate` - Генерация отчета
- `GET /api/reports/templates` - Список шаблонов
- `GET /api/reports/templates/:id` - Получение шаблона

#### Dashboards
- `POST /api/dashboards` - Создание дашборда
- `GET /api/dashboards/:id` - Получение дашборда
- `PUT /api/dashboards/:id` - Обновление дашборда
- `DELETE /api/dashboards/:id` - Удаление дашборда
- `POST /api/dashboards/:id/widgets` - Добавление виджета
- `GET /api/dashboards/:id/widgets/:widgetId/data` - Данные виджета

#### KPIs
- `POST /api/kpis` - Определение KPI
- `GET /api/kpis/:id` - Получение KPI
- `POST /api/kpis/:id/calculate` - Расчет KPI
- `GET /api/kpis/:id/history` - История расчетов

#### Visualizations
- `POST /api/visualizations` - Создание визуализации
- `GET /api/visualizations/:id` - Получение визуализации
- `POST /api/visualizations/charts` - Генерация графика

#### Insights
- `POST /api/insights/generate` - Генерация инсайтов
- `GET /api/insights/:id` - Получение инсайтов
- `GET /api/insights` - Список инсайтов

#### Alerts
- `POST /api/alerts/rules` - Создание правила алерта
- `GET /api/alerts/rules` - Список правил
- `POST /api/alerts/evaluate` - Оценка правил
- `GET /api/alerts` - Список алертов
- `POST /api/alerts/:id/acknowledge` - Подтверждение алерта
- `POST /api/alerts/:id/resolve` - Решение алерта

#### Exports
- `POST /api/exports` - Создание экспорта
- `POST /api/exports/:id/process` - Обработка экспорта
- `GET /api/exports/:id` - Получение экспорта
- `GET /api/exports/:id/download` - Скачивание файла

## Установка и запуск

### Требования
- Node.js 18+
- npm или yarn
- Redis (для кэширования)
- PostgreSQL (для хранения данных)
- ClickHouse (для аналитики)

### Установка
```bash
npm install
```

### Запуск
```bash
npm start
```

### Разработка
```bash
npm run dev
```

### Тестирование
```bash
npm test
```

## Конфигурация

### Переменные окружения
```env
PORT=3007
NODE_ENV=development
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://localhost:5432/analytics
CLICKHOUSE_URL=http://localhost:8123
JWT_SECRET=your-secret-key
```

### Настройка логирования
Логи сохраняются в директории `logs/`:
- `analytics-engine.log` - Логи аналитического движка
- `report-generator.log` - Логи генератора отчетов
- `dashboard-manager.log` - Логи менеджера дашбордов
- `kpi-calculator.log` - Логи калькулятора KPI
- `data-visualizer.log` - Логи визуализатора данных
- `insight-engine.log` - Логи движка инсайтов
- `alert-manager.log` - Логи менеджера уведомлений
- `export-service.log` - Логи сервиса экспорта

## Использование

### Создание дашборда
```javascript
const dashboard = await fetch('/api/dashboards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sales Dashboard',
    description: 'Dashboard for sales analytics',
    widgets: [],
    layout: 'grid',
    theme: 'default'
  })
});
```

### Добавление виджета
```javascript
const widget = await fetch('/api/dashboards/dashboard-id/widgets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'chart',
    title: 'Sales Trend',
    config: { chartType: 'line' },
    dataSource: 'sales-data'
  })
});
```

### Генерация отчета
```javascript
const report = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'sales-report',
    data: salesData,
    options: { format: 'pdf' }
  })
});
```

### Создание KPI
```javascript
const kpi = await fetch('/api/kpis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sales Growth',
    formula: 'sum(sales) / sum(sales_previous) * 100',
    dataSource: 'sales',
    aggregation: 'sum',
    timeRange: '1d'
  })
});
```

## Мониторинг

### Health Check
```bash
curl http://localhost:3007/health
```

### Метрики
- Количество обработанных запросов
- Время отклика
- Использование памяти
- Количество активных соединений

## Безопасность

### Аутентификация
- JWT токены для API доступа
- Проверка прав доступа к дашбордам и отчетам

### Валидация данных
- Валидация входных данных с помощью Joi
- Санитизация данных для предотвращения XSS

### Логирование
- Детальное логирование всех операций
- Аудит доступа к данным

## Расширение

### Добавление новых типов виджетов
1. Создайте новый модуль в `modules/`
2. Добавьте обработку в `data-visualizer.js`
3. Обновите API в `routes/visualizations.js`

### Добавление новых форматов экспорта
1. Добавьте новый метод в `export-service.js`
2. Обновите `processExport` для поддержки нового формата
3. Добавьте соответствующие тесты

### Добавление новых типов KPI
1. Расширьте `kpi-calculator.js`
2. Добавьте новые формулы в `evaluateFormula`
3. Обновите документацию

## Лицензия

MIT License
