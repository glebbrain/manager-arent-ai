# X11UIProvider Architecture Design

**Дата**: 2025-01-30  
**Статус**: DESIGN PHASE  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ для Linux support  
**Согласно**: start.md PRODUCTION WORKFLOW - NEXT PHASE PLANNING

## 📋 Обзор

X11UIProvider - это реализация интерфейса `IUIProvider` для Linux систем с X11 Display Server. Обеспечивает доступ к UI элементам через X11 API.

## 🏗️ Архитектура

### 1. Структура классов

```cpp
namespace freerpacapture {

class X11UIProvider : public IUIProvider {
private:
    Display* display_;                  ///< X11 display connection
    Window root_window_;                ///< Root window handle
    bool initialized_;                  ///< Initialization status
    mutable std::string last_error_;    ///< Last error message
    
    // X11 specific contexts
    XContext element_context_;          ///< Context for UI elements
    
public:
    X11UIProvider();
    virtual ~X11UIProvider();
    
    // IUIProvider interface implementation
    virtual bool Initialize() override;
    virtual void Shutdown() override;
    virtual ProviderType GetType() const override;
    virtual ProviderCapabilities GetCapabilities() const override;
    virtual std::vector<std::shared_ptr<UIElement>> GetRootElements() override;
    virtual std::shared_ptr<UIElement> GetElementAtPoint(const Point& point) override;
    virtual std::shared_ptr<UIElement> GetElementByAutomationId(
        const std::string& automationId, 
        std::shared_ptr<UIElement> searchRoot = nullptr) override;
    virtual std::vector<std::shared_ptr<UIElement>> FindElements(
        const std::string& selector,
        std::shared_ptr<UIElement> searchRoot = nullptr) override;
    virtual bool HighlightElement(std::shared_ptr<UIElement> element) override;
    virtual bool InteractWithElement(
        std::shared_ptr<UIElement> element, 
        const std::string& action, 
        const std::map<std::string, std::string>& parameters = {}) override;
    virtual std::string GetLastError() const override;
    
private:
    // X11 specific methods
    std::vector<Window> EnumerateWindowsRecursive(Window window);
    std::shared_ptr<UIElement> ConvertWindowToElement(Window window);
    bool GetWindowProperties(Window window, std::map<std::string, std::string>& properties);
    Window GetWindowAtPoint(int x, int y);
    bool SendX11Event(Window window, const std::string& action, 
                      const std::map<std::string, std::string>& params);
    
    // Utility methods
    std::string GetWindowClassName(Window window);
    std::string GetWindowTitle(Window window);
    Rectangle GetWindowBounds(Window window);
    bool IsWindowVisible(Window window);
    bool IsWindowEnabled(Window window);
};

} // namespace freerpacapture
```

### 2. Зависимости

**Требуемые X11 библиотеки:**
- `libX11` - основные X11 функции
- `libXext` - расширения X11
- `libXtst` - для event simulation (XSendEvent)
- `libXmu` - утилиты X11

**CMake Integration:**
```cmake
# В CMakeLists.txt для Linux
if(UNIX AND NOT APPLE)
    find_package(X11 REQUIRED)
    if(X11_FOUND)
        target_link_libraries(freerpacapture_providers
            X11::X11
            X11::Xext  
            X11::Xtst
            X11::Xmu
        )
        target_compile_definitions(freerpacapture_providers PRIVATE 
            FREERPACAPTURE_HAS_X11=1
        )
    endif()
endif()
```

## 🔧 Ключевые компоненты

### 1. Window Enumeration (XQueryTree)

```cpp
std::vector<Window> X11UIProvider::EnumerateWindowsRecursive(Window window) {
    std::vector<Window> windows;
    
    Window root, parent;
    Window* children = nullptr;
    unsigned int num_children = 0;
    
    if (XQueryTree(display_, window, &root, &parent, &children, &num_children) != 0) {
        for (unsigned int i = 0; i < num_children; ++i) {
            windows.push_back(children[i]);
            
            // Рекурсивное перечисление дочерних окон
            auto child_windows = EnumerateWindowsRecursive(children[i]);
            windows.insert(windows.end(), child_windows.begin(), child_windows.end());
        }
        
        if (children) {
            XFree(children);
        }
    }
    
    return windows;
}
```

### 2. Element Property Inspection

```cpp
bool X11UIProvider::GetWindowProperties(Window window, 
                                       std::map<std::string, std::string>& properties) {
    // Получение имени класса
    XClassHint class_hint;
    if (XGetClassHint(display_, window, &class_hint) != 0) {
        if (class_hint.res_class) {
            properties["className"] = std::string(class_hint.res_class);
            XFree(class_hint.res_class);
        }
        if (class_hint.res_name) {
            properties["instanceName"] = std::string(class_hint.res_name);
            XFree(class_hint.res_name);
        }
    }
    
    // Получение заголовка окна
    char* window_name = nullptr;
    if (XFetchName(display_, window, &window_name) != 0 && window_name) {
        properties["title"] = std::string(window_name);
        XFree(window_name);
    }
    
    // Получение атрибутов окна
    XWindowAttributes attrs;
    if (XGetWindowAttributes(display_, window, &attrs) != 0) {
        properties["x"] = std::to_string(attrs.x);
        properties["y"] = std::to_string(attrs.y);
        properties["width"] = std::to_string(attrs.width);
        properties["height"] = std::to_string(attrs.height);
        properties["visible"] = (attrs.map_state == IsViewable) ? "true" : "false";
    }
    
    return true;
}
```

### 3. Event Simulation (XSendEvent)

```cpp
bool X11UIProvider::SendX11Event(Window window, const std::string& action,
                                 const std::map<std::string, std::string>& params) {
    if (action == "click") {
        // Симуляция клика мыши
        int x = std::stoi(params.at("x"));
        int y = std::stoi(params.at("y"));
        
        XEvent event;
        event.type = ButtonPress;
        event.xbutton.button = Button1; // Левая кнопка мыши
        event.xbutton.same_screen = True;
        event.xbutton.subwindow = window;
        event.xbutton.window = window;
        event.xbutton.x = x;
        event.xbutton.y = y;
        event.xbutton.x_root = x;
        event.xbutton.y_root = y;
        event.xbutton.state = 0;
        event.xbutton.time = CurrentTime;
        
        if (XSendEvent(display_, window, False, ButtonPressMask, &event) == 0) {
            return false;
        }
        
        // Симуляция отпускания кнопки
        event.type = ButtonRelease;
        return XSendEvent(display_, window, False, ButtonReleaseMask, &event) != 0;
    }
    else if (action == "type") {
        // Симуляция ввода текста
        const std::string& text = params.at("text");
        for (char c : text) {
            XEvent event;
            event.type = KeyPress;
            event.xkey.keycode = XKeysymToKeycode(display_, c);
            event.xkey.window = window;
            event.xkey.same_screen = True;
            event.xkey.time = CurrentTime;
            event.xkey.state = 0;
            
            if (XSendEvent(display_, window, False, KeyPressMask, &event) == 0) {
                return false;
            }
            
            event.type = KeyRelease;
            if (XSendEvent(display_, window, False, KeyReleaseMask, &event) == 0) {
                return false;
            }
        }
        return true;
    }
    
    return false;
}
```

## 🔄 Integration Points

### 1. ProviderType Extension

В `ui_provider.h` добавить:
```cpp
enum class ProviderType {
    UIA,           ///< Microsoft UI Automation
    MSAA,          ///< Microsoft Active Accessibility
    IAccessible2,  ///< IAccessible2
    JavaBridge,    ///< Java Access Bridge
    WebView2,      ///< WebView2/Chrome DevTools
    Win32,         ///< Raw Win32 API
    X11            ///< X11 Display Server (Linux)  // NEW
};
```

### 2. Factory Integration

В `InternalUIProviderFactory::CreateProvider()`:
```cpp
case ProviderType::X11:
#ifdef FREERPACAPTURE_HAS_X11
    return std::make_unique<X11UIProvider>();
#else
    throw std::runtime_error("X11 provider not available - compiled without X11 support");
#endif
```

### 3. Capabilities Definition

```cpp
ProviderCapabilities X11UIProvider::GetCapabilities() const {
    ProviderCapabilities caps;
    caps.can_enumerate_tree = true;      // ✅ XQueryTree support
    caps.can_get_attributes = true;      // ✅ XGetWindowAttributes, XFetchName
    caps.can_highlight = true;           // ✅ XDrawRectangle для подсветки
    caps.can_interact = true;            // ✅ XSendEvent support
    caps.supports_events = false;        // ⚠️ Событийная модель сложнее в X11
    caps.supports_text_patterns = false; // ⚠️ Требует дополнительной работы
    caps.supports_value_patterns = false;// ⚠️ Требует дополнительной работы
    return caps;
}
```

## 📁 Файловая структура

```
src/pal/linux/
├── X11UIProvider.h          # Header файл
├── X11UIProvider.cpp        # Основная реализация
├── X11Utils.h               # Утилиты для работы с X11
└── X11Utils.cpp             # Реализация утилит

include/freerpacapture/platform/
└── X11Types.h               # X11-специфичные типы
```

## ✅ Критерии готовности

- [ ] X11UIProvider реализует все методы IUIProvider
- [ ] Window enumeration работает с XQueryTree
- [ ] Element property inspection получает основные свойства окон
- [ ] Event simulation поддерживает click и type actions
- [ ] Интеграция с Factory и ProviderType
- [ ] CMake configuration для X11 dependencies
- [ ] Unit тесты для основных функций
- [ ] Integration тесты с реальными X11 приложениями

## 🚀 Следующие этапы

1. **Базовая реализация X11UIProvider** (Неделя 1)
2. **Window enumeration с XQueryTree** (Неделя 1-2)  
3. **Property inspection реализация** (Неделя 2)
4. **Event simulation с XSendEvent** (Неделя 3)
5. **Factory integration и тестирование** (Неделя 3-4)
6. **Документация и optimization** (Неделя 4)

---

**Время выполнения**: 3-4 недели  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ для Linux support  
**Зависимости**: libX11, libXext, libXtst, libXmu
