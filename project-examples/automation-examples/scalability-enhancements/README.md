# Scalability Enhancements System

Система улучшения масштабируемости и производительности для Universal Automation Platform.

## Возможности

### Основные функции
- **Load Balancer**: Балансировка нагрузки между серверами
- **Cache Manager**: Управление кэшированием с поддержкой Redis
- **Performance Monitor**: Мониторинг производительности в реальном времени
- **Resource Optimizer**: Оптимизация ресурсов (изображения, CSS, JS, HTML)
- **Queue Manager**: Управление очередями задач с Bull и Agenda
- **Database Optimizer**: Оптимизация запросов и индексов базы данных
- **CDN Manager**: Управление CDN и кэшированием контента
- **Auto Scaler**: Автоматическое масштабирование на основе метрик

### Типы оптимизации
- **Горизонтальное масштабирование**: Добавление серверов и балансировка нагрузки
- **Вертикальное масштабирование**: Увеличение ресурсов существующих серверов
- **Кэширование**: Многоуровневое кэширование данных
- **Оптимизация ресурсов**: Сжатие и оптимизация статических файлов
- **Оптимизация базы данных**: Индексы, запросы и производительность
- **CDN**: Распределение контента по географическим регионам

## Архитектура

### Микросервисы
- **load-balancer**: Балансировка нагрузки
- **cache-manager**: Управление кэшем
- **performance-monitor**: Мониторинг производительности
- **resource-optimizer**: Оптимизация ресурсов
- **queue-manager**: Управление очередями
- **database-optimizer**: Оптимизация БД
- **cdn-manager**: Управление CDN
- **auto-scaler**: Автоматическое масштабирование

### API Endpoints

#### Scalability
- `POST /api/scalability/load-balancer/servers` - Добавление сервера
- `GET /api/scalability/load-balancer/next-server` - Получение следующего сервера
- `GET /api/scalability/load-balancer/stats` - Статистика балансировщика
- `POST /api/scalability/auto-scaler/policies` - Добавление политики масштабирования
- `GET /api/scalability/auto-scaler/status` - Статус автоскейлинга

#### Performance
- `POST /api/performance/monitoring/start` - Запуск мониторинга
- `GET /api/performance/metrics/current` - Текущие метрики
- `GET /api/performance/metrics/history` - История метрик
- `POST /api/performance/thresholds` - Установка пороговых значений
- `GET /api/performance/alerts` - Получение алертов

#### Cache
- `POST /api/cache/caches` - Создание кэша
- `POST /api/cache/caches/:id/set` - Установка значения в кэш
- `GET /api/cache/caches/:id/get/:key` - Получение значения из кэша
- `GET /api/cache/caches/:id/stats` - Статистика кэша
- `POST /api/cache/caches/:id/warm` - Прогрев кэша

#### Queue
- `POST /api/queue/queues` - Создание очереди
- `POST /api/queue/queues/:name/jobs` - Добавление задачи
- `GET /api/queue/queues/:name/stats` - Статистика очереди
- `POST /api/queue/queues/:name/pause` - Приостановка очереди
- `POST /api/queue/queues/:name/resume` - Возобновление очереди

#### Monitoring
- `GET /api/monitoring/overview` - Обзор системы
- `GET /api/monitoring/metrics/realtime` - Метрики в реальном времени
- `GET /api/monitoring/alerts` - Получение алертов
- `GET /api/monitoring/health-score` - Оценка здоровья системы
- `GET /api/monitoring/trends` - Тренды производительности

#### Optimization
- `POST /api/optimization/resources/images/optimize` - Оптимизация изображений
- `POST /api/optimization/resources/compress` - Сжатие данных
- `POST /api/optimization/database/query` - Выполнение оптимизированного запроса
- `POST /api/optimization/database/indexes` - Создание индекса
- `POST /api/optimization/cdn/purge` - Очистка кэша CDN

## Установка и запуск

### Требования
- Node.js 18+
- npm или yarn
- Redis (для кэширования и очередей)
- PostgreSQL (для базы данных)
- MongoDB (для планировщика задач)

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

### Бенчмарки
```bash
npm run benchmark
```

### Нагрузочное тестирование
```bash
npm run load-test
```

## Конфигурация

### Переменные окружения
```env
PORT=3008
NODE_ENV=development
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://localhost:5432/scalability
MONGODB_URL=mongodb://localhost:27017/queue-manager
JWT_SECRET=your-secret-key
```

### Настройка логирования
Логи сохраняются в директории `logs/`:
- `load-balancer.log` - Логи балансировщика нагрузки
- `cache-manager.log` - Логи менеджера кэша
- `performance-monitor.log` - Логи мониторинга производительности
- `resource-optimizer.log` - Логи оптимизатора ресурсов
- `queue-manager.log` - Логи менеджера очередей
- `database-optimizer.log` - Логи оптимизатора БД
- `cdn-manager.log` - Логи менеджера CDN
- `auto-scaler.log` - Логи автоскейлера

## Использование

### Создание балансировщика нагрузки
```javascript
const response = await fetch('/api/scalability/load-balancer/servers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    host: 'server1.example.com',
    port: 3000,
    weight: 1,
    maxConnections: 1000
  })
});
```

### Настройка кэширования
```javascript
const response = await fetch('/api/cache/caches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'user-cache',
    strategy: 'lru',
    maxSize: 1000,
    ttl: 3600,
    compression: true,
    persistence: true
  })
});
```

### Мониторинг производительности
```javascript
const response = await fetch('/api/performance/monitoring/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interval: 5000
  })
});
```

### Оптимизация изображений
```javascript
const response = await fetch('/api/optimization/resources/images/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: base64ImageData,
    options: {
      strategy: 'balanced',
      format: 'webp',
      width: 800,
      height: 600
    }
  })
});
```

### Создание очереди задач
```javascript
const response = await fetch('/api/queue/queues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'email-queue',
    options: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  })
});
```

## Мониторинг

### Health Check
```bash
curl http://localhost:3008/health
```

### Метрики производительности
- Использование CPU и памяти
- Время отклика запросов
- Количество активных соединений
- Статистика кэша и очередей
- Метрики базы данных

### Алерты
- Пороговые значения для ресурсов
- Уведомления о критических событиях
- Автоматическое масштабирование

## Безопасность

### Аутентификация
- JWT токены для API доступа
- Проверка прав доступа к ресурсам

### Валидация данных
- Валидация входных данных с помощью Joi
- Санитизация данных для предотвращения атак

### Логирование
- Детальное логирование всех операций
- Аудит доступа к ресурсам

## Расширение

### Добавление новых стратегий балансировки
1. Создайте новый метод в `load-balancer.js`
2. Добавьте обработку в `getNextServer`
3. Обновите API в `routes/scalability.js`

### Добавление новых типов кэширования
1. Расширьте `cache-manager.js`
2. Добавьте новые стратегии в `initializeDefaultStrategies`
3. Обновите документацию

### Добавление новых метрик
1. Расширьте `performance-monitor.js`
2. Добавьте новые метрики в `collectMetrics`
3. Обновите API в `routes/performance.js`

## Производительность

### Оптимизация
- Сжатие данных (GZIP, Brotli)
- Оптимизация изображений (WebP, AVIF)
- Кэширование на нескольких уровнях
- Оптимизация запросов к БД

### Масштабирование
- Горизонтальное масштабирование
- Автоматическое масштабирование
- Балансировка нагрузки
- CDN для статического контента

## Лицензия

MIT License
