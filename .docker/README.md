# Docker Configuration - ManagerAgentAI

Эта папка содержит все Docker-конфигурации для различных компонентов ManagerAgentAI.

## 📁 Docker Files

### 🐳 Docker Compose
- `docker-compose.yml` - Основной файл Docker Compose для запуска всех сервисов

### 🔧 Dockerfiles

#### Infrastructure Services
- `Dockerfile.api-gateway` - API Gateway сервис
- `Dockerfile.microservices` - Микросервисная архитектура
- `Dockerfile.event-bus` - Event Bus для межсервисного взаимодействия

#### Monitoring & Analytics
- `Dockerfile.dashboard` - Основной дашборд
- `Dockerfile.interactive-dashboards` - Интерактивные дашборды
- `Dockerfile.forecasting` - Сервис прогнозирования
- `Dockerfile.benchmarking` - Сервис бенчмаркинга

#### Data & Export
- `Dockerfile.data-export` - Сервис экспорта данных
- `Dockerfile.deadline-prediction` - Сервис прогнозирования дедлайнов

#### Task Management
- `Dockerfile.sprint-planning` - Планирование спринтов
- `Dockerfile.task-dependency-management` - Управление зависимостями задач
- `Dockerfile.task-distribution` - Распределение задач
- `Dockerfile.automatic-status-updates` - Автоматические обновления статуса

#### Security & Compliance
- `Dockerfile.advanced-security-scanner` - Продвинутый сканер безопасности

#### API & Versioning
- `Dockerfile.api-versioning` - Версионирование API

## 🚀 Использование

### Запуск всех сервисов
```bash
# Из корневой папки проекта
docker-compose -f .docker/docker-compose.yml up -d
```

### Запуск конкретного сервиса
```bash
# Сборка и запуск конкретного сервиса
docker build -f .docker/Dockerfile.api-gateway -t manager-agent-ai/api-gateway .
docker run -d --name api-gateway -p 3000:3000 manager-agent-ai/api-gateway
```

### Остановка сервисов
```bash
# Остановка всех сервисов
docker-compose -f .docker/docker-compose.yml down

# Остановка конкретного контейнера
docker stop <container_name>
```

## 🔧 Конфигурация

### Переменные окружения
Каждый Dockerfile может использовать переменные окружения для конфигурации:
- `NODE_ENV` - Окружение (development, production)
- `PORT` - Порт сервиса
- `LOG_LEVEL` - Уровень логирования
- `DATABASE_URL` - URL базы данных
- `REDIS_URL` - URL Redis

### Порты сервисов
- **API Gateway**: 3000
- **Microservices**: 3001-3010
- **Dashboard**: 3000 (если запускается отдельно)
- **Event Bus**: 4000
- **Database**: 5432 (PostgreSQL)
- **Redis**: 6379

## 📋 Требования

- Docker 20.10+
- Docker Compose 2.0+
- Минимум 4GB RAM
- Минимум 2 CPU cores

## 🛠️ Разработка

### Сборка всех образов
```bash
# Сборка всех Dockerfile'ов
for file in .docker/Dockerfile.*; do
    service_name=$(basename "$file" | sed 's/Dockerfile\.//')
    docker build -f "$file" -t "manager-agent-ai/$service_name" .
done
```

### Просмотр логов
```bash
# Логи всех сервисов
docker-compose -f .docker/docker-compose.yml logs -f

# Логи конкретного сервиса
docker-compose -f .docker/docker-compose.yml logs -f api-gateway
```

### Очистка
```bash
# Удаление всех контейнеров
docker-compose -f .docker/docker-compose.yml down --volumes --remove-orphans

# Удаление всех образов
docker rmi $(docker images "manager-agent-ai/*" -q)
```

## 🔒 Безопасность

- Все образы используют non-root пользователей
- Секреты передаются через переменные окружения
- Сетевая изоляция между сервисами
- Регулярные обновления базовых образов

## 📈 Мониторинг

- Health checks для всех сервисов
- Логирование в JSON формате
- Метрики Prometheus (если включено)
- Трейсинг с Jaeger (если включено)

---

**ManagerAgentAI Docker Configuration** - Контейнеризованная архитектура для масштабируемого развертывания
