# Compliance Automation System

Система автоматизированной проверки соответствия и отчетности для Universal Automation Platform.

## Возможности

### Основные функции
- **Compliance Engine**: Движок соответствия с поддержкой различных фреймворков
- **Audit Manager**: Управление аудитами и проверками
- **Report Generator**: Генерация отчетов в различных форматах
- **Policy Manager**: Управление политиками и процедурами
- **Risk Assessor**: Оценка и управление рисками
- **Evidence Collector**: Сбор и управление доказательствами
- **Remediation Manager**: Управление исправлениями
- **Notification Service**: Уведомления и алерты

### Поддерживаемые стандарты соответствия
- **GDPR**: General Data Protection Regulation
- **HIPAA**: Health Insurance Portability and Accountability Act
- **SOC 2**: Service Organization Control 2
- **PCI DSS**: Payment Card Industry Data Security Standard
- **ISO 27001**: Information Security Management System
- **SOX**: Sarbanes-Oxley Act
- **CCPA**: California Consumer Privacy Act
- **PIPEDA**: Personal Information Protection and Electronic Documents Act

### Типы аудитов
- **Security Audit**: Комплексная оценка безопасности
- **Compliance Audit**: Оценка соответствия требованиям
- **Data Audit**: Оценка защиты данных и конфиденциальности
- **Access Audit**: Проверка доступа и разрешений
- **Infrastructure Audit**: Оценка IT-инфраструктуры

## Архитектура

### Микросервисы
- **compliance-engine**: Движок соответствия
- **audit-manager**: Управление аудитами
- **report-generator**: Генерация отчетов
- **policy-manager**: Управление политиками
- **risk-assessor**: Оценка рисков
- **evidence-collector**: Сбор доказательств
- **remediation-manager**: Управление исправлениями
- **notification-service**: Уведомления

### API Endpoints

#### Compliance
- `POST /api/compliance/assessments` - Запуск оценки соответствия
- `GET /api/compliance/assessments/:id` - Получение оценки
- `GET /api/compliance/violations` - Получение нарушений
- `GET /api/compliance/frameworks` - Получение фреймворков
- `GET /api/compliance/controls` - Получение контролей

#### Audit
- `POST /api/audit/audits` - Создание аудита
- `POST /api/audit/audits/:id/start` - Запуск аудита
- `POST /api/audit/audits/:id/complete` - Завершение аудита
- `POST /api/audit/audits/:id/findings` - Добавление находок
- `GET /api/audit/audits` - Список аудитов

#### Reports
- `POST /api/reports/generate` - Генерация отчета
- `GET /api/reports/:id` - Получение отчета
- `GET /api/reports/:id/download` - Скачивание отчета
- `POST /api/reports/schedules` - Планирование отчета

#### Policies
- `POST /api/policies/policies` - Создание политики
- `POST /api/policies/policies/:id/approve` - Отправка на утверждение
- `POST /api/policies/approvals/:id/approve` - Утверждение политики
- `POST /api/policies/policies/:id/review` - Планирование пересмотра

#### Risks
- `POST /api/risks/risks` - Создание риска
- `POST /api/risks/risks/:id/assess` - Оценка риска
- `POST /api/risks/risks/:id/mitigations` - Добавление митигации
- `GET /api/risks/matrix` - Матрица рисков

#### Evidence
- `POST /api/evidence/evidence` - Сбор доказательств
- `GET /api/evidence/evidence` - Список доказательств
- `GET /api/evidence/evidence/search` - Поиск доказательств
- `GET /api/evidence/types` - Типы доказательств

## Установка и запуск

### Требования
- Node.js 18+
- npm или yarn
- Redis (для кэширования)
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

### Аудит
```bash
npm run audit
```

### Генерация отчета
```bash
npm run report
```

## Конфигурация

### Переменные окружения
```env
PORT=3009
NODE_ENV=development
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://localhost:5432/compliance
MONGODB_URL=mongodb://localhost:27017/compliance-automation
JWT_SECRET=your-secret-key
```

### Настройка логирования
Логи сохраняются в директории `logs/`:
- `compliance-engine.log` - Логи движка соответствия
- `audit-manager.log` - Логи менеджера аудитов
- `report-generator.log` - Логи генератора отчетов
- `policy-manager.log` - Логи менеджера политик
- `risk-assessor.log` - Логи оценщика рисков
- `evidence-collector.log` - Логи сборщика доказательств

## Использование

### Запуск оценки соответствия
```javascript
const response = await fetch('/api/compliance/assessments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    frameworkId: 'gdpr',
    scope: {
      systems: ['web-app', 'api', 'database'],
      dataTypes: ['personal', 'sensitive']
    }
  })
});
```

### Создание аудита
```javascript
const response = await fetch('/api/audit/audits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'security_audit',
    name: 'Q1 Security Audit',
    scope: ['access_control', 'encryption', 'network_security'],
    priority: 'high',
    assignedTo: 'security-team@company.com'
  })
});
```

### Генерация отчета
```javascript
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'compliance_report',
    data: {
      companyName: 'Universal Automation Platform',
      period: 'Q1 2024',
      assessments: assessmentData,
      violations: violationData
    }
  })
});
```

### Создание политики
```javascript
const response = await fetch('/api/policies/policies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Data Protection Policy',
    category: 'privacy',
    content: policyContent,
    requirements: ['gdpr', 'ccpa'],
    stakeholders: ['compliance@company.com', 'legal@company.com']
  })
});
```

### Оценка риска
```javascript
const response = await fetch('/api/risks/risks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Data Breach Risk',
    category: 'security',
    subcategory: 'data_breach',
    description: 'Risk of unauthorized access to sensitive data',
    impact: 8,
    likelihood: 6,
    owner: 'security-team@company.com'
  })
});
```

## Мониторинг

### Health Check
```bash
curl http://localhost:3009/health
```

### Метрики соответствия
- Общий балл соответствия
- Количество нарушений по уровням
- Статус оценок по фреймворкам
- Тренды соответствия

### Метрики аудитов
- Количество завершенных аудитов
- Количество находок по критичности
- Время выполнения аудитов
- Статус исправлений

### Метрики рисков
- Распределение рисков по приоритетам
- Статус митигаций
- Тренды рисков
- Матрица рисков

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
- Защита конфиденциальных данных

## Расширение

### Добавление нового фреймворка соответствия
1. Добавьте фреймворк в `compliance-engine.js`
2. Определите контроли и требования
3. Обновите документацию

### Добавление нового типа аудита
1. Создайте новый тип в `audit-manager.js`
2. Определите область и требования
3. Добавьте шаблон отчета

### Добавление нового типа доказательств
1. Расширьте `evidence-collector.js`
2. Добавьте правила валидации
3. Обновите типы файлов

## Производительность

### Оптимизация
- Кэширование результатов оценок
- Асинхронная обработка отчетов
- Пакетная обработка доказательств

### Масштабирование
- Горизонтальное масштабирование
- Распределенная обработка
- Кластеризация сервисов

## Лицензия

MIT License
