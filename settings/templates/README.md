# ManagerAgentAI Universal Templates

Универсальная система шаблонов для быстрого создания проектов различных типов.

## 🚀 Возможности

- **8 типов проектов**: Web, Mobile, AI/ML, API, Library, Game, Blockchain, Desktop
- **Автоматическая генерация**: Полная структура проекта и файлы
- **Кроссплатформенность**: Windows PowerShell и Node.js
- **Гибкая настройка**: Настраиваемые зависимости и конфигурации
- **Готовые к использованию**: Сразу после создания

## 📋 Доступные шаблоны

### Frontend
- **Web Application** - Современные веб-приложения с React, TypeScript, Node.js

### Mobile
- **Mobile Application** - Кроссплатформенные мобильные приложения с React Native

### Backend
- **API Service** - RESTful API сервисы с Express и TypeScript

### AI/ML
- **AI/ML Project** - Проекты машинного обучения с Python экосистемой

### Libraries
- **Library Package** - Переиспользуемые библиотеки и npm пакеты

### Gaming
- **Game Development** - Проекты разработки игр на Unity

### Web3
- **Blockchain Project** - Web3 и блокчейн приложения с Solidity

### Desktop
- **Desktop Application** - Кроссплатформенные десктопные приложения с Electron

## 🛠 Использование

### Windows PowerShell

```powershell
# Список доступных шаблонов
.\scripts\template-generator.ps1 list

# Создание нового проекта
.\scripts\template-generator.ps1 create my-app web

# Создание без установки зависимостей
.\scripts\template-generator.ps1 create my-app web -NoInstall

# Создание без инициализации Git
.\scripts\template-generator.ps1 create my-app web -NoGit
```

### Node.js

```bash
# Список доступных шаблонов
node scripts/template-generator.js list

# Создание нового проекта
node scripts/template-generator.js create my-app web

# Создание без установки зависимостей
node scripts/template-generator.js create my-app web --no-install

# Создание без инициализации Git
node scripts/template-generator.js create my-app web --no-git
```

## 📁 Структура шаблонов

Каждый шаблон содержит:

- **template.json** - Конфигурация шаблона
- **Структура директорий** - Готовая файловая структура
- **Зависимости** - Production и development зависимости
- **Скрипты** - Готовые npm скрипты
- **Конфигурация** - Настройки проекта
- **Функции** - Включенные возможности

## ⚙️ Конфигурация шаблона

```json
{
  "template": {
    "name": "Template Name",
    "version": "1.0.0",
    "description": "Template description",
    "type": "template-type",
    "category": "category",
    "tags": ["tag1", "tag2"],
    "author": "ManagerAgentAI"
  },
  "structure": {
    "directories": ["dir1", "dir2"],
    "files": ["file1.ts", "file2.js"]
  },
  "dependencies": {
    "production": ["dep1", "dep2"],
    "development": ["dev-dep1", "dev-dep2"]
  },
  "scripts": {
    "dev": "start command",
    "build": "build command"
  },
  "configuration": {
    "port": 3000,
    "database": "mongodb://localhost:27017/app"
  },
  "features": {
    "typescript": true,
    "testing": true,
    "linting": true
  }
}
```

## 🔧 Создание собственного шаблона

1. Создайте новую директорию в `templates/`
2. Создайте файл `template.json` с конфигурацией
3. Добавьте шаблон в `templates/templates.json`
4. Протестируйте создание проекта

## 📊 Статистика шаблонов

| Тип | Популярность | Сложность | Технологии |
|-----|-------------|-----------|------------|
| Web | 95% | Medium | React, TypeScript, Node.js |
| Mobile | 90% | Medium | React Native, Expo |
| AI/ML | 85% | High | Python, TensorFlow, PyTorch |
| API | 88% | Medium | Express, TypeScript, MongoDB |
| Library | 75% | Low | TypeScript, Rollup, Jest |
| Game | 80% | High | Unity, C# |
| Blockchain | 70% | High | Solidity, Hardhat, Web3 |
| Desktop | 65% | Medium | Electron, TypeScript |

## 🎯 Особенности

- **Автоматическая установка зависимостей**
- **Инициализация Git репозитория**
- **Готовая структура проекта**
- **Настроенные скрипты сборки**
- **Конфигурация линтеров и форматтеров**
- **Документация и примеры**
- **Тестовые файлы**

## 📝 Примеры использования

### Создание веб-приложения
```powershell
.\scripts\template-generator.ps1 create my-web-app web
cd my-web-app
npm run dev
```

### Создание мобильного приложения
```powershell
.\scripts\template-generator.ps1 create my-mobile-app mobile
cd my-mobile-app
npm run start
```

### Создание AI/ML проекта
```powershell
.\scripts\template-generator.ps1 create my-ai-project ai-ml
cd my-ai-project
pip install -r requirements.txt
jupyter notebook
```

## 🔄 Обновления

Система шаблонов автоматически обновляется при изменении конфигураций. Все шаблоны версионируются и поддерживают обратную совместимость.

## 📞 Поддержка

Для вопросов и предложений по улучшению системы шаблонов обращайтесь к ManagerAgentAI.

---

**Создано с ❤️ ManagerAgentAI Template System**
