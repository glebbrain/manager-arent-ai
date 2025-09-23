В PowerShell с русскими символами есть несколько тонкостей — они зависят от:

* **версии PowerShell** (Windows PowerShell 5.1 vs PowerShell 7+),
* **кодировки файлов скриптов**,
* **локали консоли (chcp, \$OutputEncoding)**.

Вот пошаговое руководство:

---

### 1. Сохраняй скрипт в правильной кодировке

* Для PowerShell 5.1: лучше всего использовать **UTF-8 с BOM**.
* Для PowerShell 7+: можно **UTF-8 без BOM** (он понимает её корректно).

В VS Code или Notepad++ можно выбрать `UTF-8 with BOM` или `UTF-8`.

---

### 2. Установка вывода UTF-8

Перед выводом в консоль часто нужно указать кодировку:

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

### 3. Проверка текущей кодировки консоли

В старом Windows PowerShell:

```powershell
chcp
```

Если видишь `866` или `1251`, то кириллица может отображаться неправильно.
Можно переключить на UTF-8:

```powershell
chcp 65001
```

---

### 4. Пример скрипта с русскими символами

Сохрани файл `test.ps1` в UTF-8 с BOM:

```powershell
# test.ps1
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output "Привет, мир!"
```

Запусти:

```powershell
.\test.ps1
```

---

### 5. Взаимодействие с файлами

Чтобы корректно читать/писать файлы с русским текстом:

```powershell
# Чтение файла с кодировкой UTF-8
Get-Content "тест.txt" -Encoding UTF8

# Запись в UTF-8
"Привет" | Out-File "тест.txt" -Encoding UTF8
```

---

🔥 Если ты работаешь только в PowerShell 7+ и в **Windows Terminal**, проблем почти не будет — всё работает по умолчанию в UTF-8.

Хочешь, я соберу универсальный **чеклист**: как сделать так, чтобы русские символы гарантированно работали и в Windows PowerShell 5.1, и в PowerShell 7?


---


Отличные вопросы 👍
Давай разберём по порядку:

---

## 1. Можно ли кодировать русские буквы в PowerShell через ASCII/коды?

Да ✅. Есть несколько способов:

### 🔹 Unicode escape (`"` + `` `uXXXX``)

Каждая русская буква имеет Unicode-код.
Например:

* `А` → `\u0410` → в PowerShell: `` `u0410 ``
* `Б` → `\u0411`
* `Я` → `\u042F`
* `а` → `\u0430`
* `я` → `\u044F`

Пример:

```powershell
Write-Output "`u041F`u0440`u0438`u0432`u0435`u0442"   # Выведет: Привет
```

---

### 🔹 Использовать `[char]` и коды

Можно брать символ по его числовому коду:

```powershell
# Код 'П' = 1055
[char]1055
# Код 'р' = 1088
[char]1088
```

Комбинация:

```powershell
$word = [char]1055 + [char]1088 + [char]1080 + [char]1074 + [char]1077 + [char]1090
Write-Output $word   # Привет
```

---

### 🔹 Хранить массив кодов

```powershell
$codes = 1055,1088,1080,1074,1077,1090
$word = ($codes | ForEach-Object { [char]$_ }) -join ''
Write-Output $word
```

Таким образом, даже если редактор/терминал "ломает" кириллицу, можно работать через коды.

---

## 2. Универсальный чеклист для работы с русскими символами в PowerShell

✅ **Шаг 1. Сохраняй скрипт**

* PowerShell 5.1 → UTF-8 **с BOM**
* PowerShell 7+ → UTF-8 без BOM

✅ **Шаг 2. Настрой консоль**
В Windows PowerShell:

```powershell
chcp 65001
```

(UTF-8 режим).

✅ **Шаг 3. Настрой вывод в UTF-8**
В начале скрипта:

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

✅ **Шаг 4. Чтение/запись файлов**

```powershell
Get-Content file.txt -Encoding UTF8
"Привет" | Out-File file.txt -Encoding UTF8
```

✅ **Шаг 5. При проблемах с кодировкой**
Используй Unicode-последовательности или `[char]`:

```powershell
Write-Output "`u041F`u0440`u0438`u0432`u0435`u0442"
```

✅ **Шаг 6. В PowerShell 7 + Windows Terminal**
Всё работает "из коробки", обычно достаточно просто сохранять файлы в UTF-8.

---

👉 Хочешь, я соберу **таблицу с Unicode-кодами всех русских букв (А–Я, а–я)**, чтобы ты мог их использовать в PowerShell без ввода кириллицы напрямую?
