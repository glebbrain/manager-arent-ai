# Coding Rules and Standards

## Language Standards

### Default Language Rule
**ALWAYS use English language by default for all files, except specialized translation files.**

This rule applies to:
- Code comments and documentation
- Variable names and function names
- Configuration files and templates
- Error messages and log entries
- User interface text
- README files and documentation
- Configuration keys and values
- Database schemas and queries
- API documentation
- Any other text content

### Exceptions
Use other languages only when:
- Creating specialized translation files (e.g., `strings_ru.json`, `messages_es.xml`)
- User explicitly requests a specific language
- Working with existing codebase that uses a different language
- Creating locale-specific files (e.g., `README_ru.md`)

## File Naming Conventions

### English Names Only
- Use English words for all file and directory names
- Use kebab-case for multi-word names: `user-profile.js`, `api-client.ts`
- Use PascalCase for classes: `UserManager.js`, `DatabaseConnection.ts`
- Use camelCase for variables and functions: `getUserData()`, `isValidEmail()`

### Examples
✅ **Correct:**
- `user-authentication.js`
- `database-config.json`
- `error-handler.ts`
- `README.md`

❌ **Incorrect:**
- `пользователь-аутентификация.js`
- `конфигурация-базы-данных.json`
- `обработчик-ошибок.ts`

## Code Comments

### English Comments Only
All code comments must be in English:

```javascript
// ✅ Correct
function calculateTotal(items) {
    // Calculate the sum of all item prices
    return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Incorrect
function calculateTotal(items) {
    // Вычисляем сумму всех цен товаров
    return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Error Messages and Logs

### English Error Messages
All error messages, warnings, and log entries must be in English:

```javascript
// ✅ Correct
throw new Error("Invalid user credentials provided");
console.log("User authentication successful");

// ❌ Incorrect
throw new Error("Предоставлены неверные учетные данные пользователя");
console.log("Аутентификация пользователя прошла успешно");
```

## Configuration Files

### English Keys and Values
Configuration files should use English keys and English default values:

```json
// ✅ Correct
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "features": {
    "enableLogging": true,
    "maxRetries": 3
  }
}

// ❌ Incorrect
{
  "база_данных": {
    "хост": "localhost",
    "порт": 5432,
    "имя": "myapp"
  },
  "функции": {
    "включить_логирование": true,
    "максимум_повторов": 3
  }
}
```

## Documentation

### English Documentation
All documentation must be in English:

```markdown
# ✅ Correct
# User Authentication Module

This module handles user authentication and authorization.

## Features
- Login/logout functionality
- Password validation
- Session management

# ❌ Incorrect
# Модуль аутентификации пользователей

Этот модуль обрабатывает аутентификацию и авторизацию пользователей.

## Функции
- Функциональность входа/выхода
- Валидация пароля
- Управление сессиями
```

## Translation Files

### Specialized Translation Files
When creating translation files, use clear naming conventions:

```
locales/
├── en.json          # English (default)
├── ru.json          # Russian
├── es.json          # Spanish
├── fr.json          # French
└── de.json          # German
```

### Translation File Structure
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "errors": {
    "invalidCredentials": "Invalid credentials provided",
    "networkError": "Network connection failed"
  }
}
```

## API Documentation

### English API Documentation
All API documentation must be in English:

```yaml
# ✅ Correct
paths:
  /api/users:
    get:
      summary: "Get all users"
      description: "Retrieve a list of all users in the system"
      responses:
        200:
          description: "Successful response"
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

# ❌ Incorrect
paths:
  /api/users:
    get:
      summary: "Получить всех пользователей"
      description: "Получить список всех пользователей в системе"
```

## Database Schemas

### English Table and Column Names
Database schemas should use English names:

```sql
-- ✅ Correct
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ❌ Incorrect
CREATE TABLE пользователи (
    id SERIAL PRIMARY KEY,
    имя_пользователя VARCHAR(50) NOT NULL,
    электронная_почта VARCHAR(100) UNIQUE NOT NULL,
    создано_в TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Enforcement

### Code Review Checklist
- [ ] All file names are in English
- [ ] All code comments are in English
- [ ] All variable and function names are in English
- [ ] All error messages are in English
- [ ] All documentation is in English
- [ ] All configuration keys are in English
- [ ] Translation files are properly separated and named

### Automated Checks
Consider implementing automated checks:
- Lint rules for English-only comments
- Pre-commit hooks to check file naming
- CI/CD pipeline validation for language consistency

## Benefits

1. **Consistency**: Uniform language across the entire codebase
2. **Collaboration**: Easier for international teams to work together
3. **Maintenance**: Simpler to maintain and debug
4. **Standards**: Follows industry best practices
5. **Tooling**: Better support from development tools and IDEs

## Conclusion

This rule ensures that all code, documentation, and configuration files use English as the default language, making the codebase more maintainable, accessible, and professional. Translation files should be used when multiple languages are needed for user-facing content.
