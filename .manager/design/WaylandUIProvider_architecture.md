# WaylandUIProvider Architecture Design

**Дата**: 2025-01-30  
**Статус**: DESIGN PHASE  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ для modern Linux support  
**Согласно**: start.md PRODUCTION WORKFLOW - NEXT PHASE PLANNING

## 📋 Обзор

WaylandUIProvider - это реализация интерфейса `IUIProvider` для современных Linux систем с Wayland Display Server. Wayland более безопасен чем X11, но требует специального подхода для UI automation через D-Bus портals и compositor-specific APIs.

## 🏗️ Архитектурные Вызовы Wayland

### **Безопасность Wayland**
- **Изоляция приложений**: Wayland изолирует приложения друг от друга
- **Нет глобального доступа**: Отсутствует прямой доступ к окнам других приложений
- **Permission-based**: Требуются специальные разрешения для UI automation

### **Решения через Portals**
- **org.freedesktop.portal.Desktop**: Стандартный portal для desktop integration
- **org.freedesktop.portal.ScreenCast**: Для захвата экрана
- **org.freedesktop.portal.RemoteDesktop**: Для automation и input simulation

## 🏗️ Архитектура WaylandUIProvider

### 1. Структура классов

```cpp
namespace freerpacapture {

class WaylandUIProvider : public IUIProvider {
private:
    // Wayland connection and registry
    struct wl_display* display_;
    struct wl_registry* registry_;
    struct wl_compositor* compositor_;
    
    // D-Bus connections for portals
    std::unique_ptr<DBusConnection> dbus_session_;
    std::unique_ptr<PortalManager> portal_manager_;
    
    // State management
    bool initialized_;
    mutable std::string last_error_;
    mutable std::mutex mutex_;
    
    // Compositor-specific adapters
    std::map<std::string, std::unique_ptr<CompositorAdapter>> adapters_;
    std::string current_compositor_;
    
    // Fallback mechanisms
    std::unique_ptr<ScreenshotAnalyzer> screenshot_analyzer_;
    std::unique_ptr<AccessibilityBridge> at_spi_bridge_;
    
public:
    WaylandUIProvider();
    virtual ~WaylandUIProvider();
    
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
    // Wayland initialization
    bool InitializeWaylandConnection();
    bool InitializePortals();
    bool DetectCompositor();
    void ShutdownWaylandConnection();
    
    // Portal-based operations
    bool RequestScreenCastAccess();
    bool RequestRemoteDesktopAccess();
    bool RequestAccessibilityAccess();
    
    // Element discovery methods
    std::vector<std::shared_ptr<UIElement>> DiscoverElementsViaPortals();
    std::vector<std::shared_ptr<UIElement>> DiscoverElementsViaATSPI();
    std::vector<std::shared_ptr<UIElement>> DiscoverElementsViaScreenshot();
    
    // Compositor-specific implementations
    bool SetupGNOMEAdapter();
    bool SetupKDEAdapter();
    bool SetupwlrootsAdapter();  // sway, river, etc.
    bool SetupOtherCompositor();
    
    // Interaction methods
    bool SimulateInputViaPortal(const Point& point, const std::string& action);
    bool SimulateInputViaCompositor(const Point& point, const std::string& action);
    
    // Utility methods
    std::string DetectCompositorName();
    bool IsPortalAvailable(const std::string& portal_name);
    Rectangle GetScreenBounds();
};

} // namespace freerpacapture
```

### 2. Компоненты архитектуры

#### **PortalManager** - Управление D-Bus Portals
```cpp
class PortalManager {
private:
    DBusConnection* connection_;
    std::map<std::string, PortalInterface> interfaces_;
    
public:
    bool Initialize(DBusConnection* conn);
    bool RequestPermission(const std::string& portal, const std::map<std::string, std::string>& options);
    bool InvokeMethod(const std::string& portal, const std::string& method, const std::vector<std::string>& args);
    
    // Specific portal methods
    bool StartScreenCast();
    bool StartRemoteDesktop();
    bool SimulateKeyPress(const std::string& key);
    bool SimulateMouseClick(int x, int y, int button);
};
```

#### **CompositorAdapter** - Compositor-specific integrations
```cpp
class CompositorAdapter {
public:
    virtual ~CompositorAdapter() = default;
    virtual bool Initialize() = 0;
    virtual std::vector<WindowInfo> GetWindows() = 0;
    virtual bool GetWindowProperties(const WindowInfo& window, ElementProperties& props) = 0;
    virtual bool SimulateInput(const Point& point, const std::string& action) = 0;
};

class GNOMEShellAdapter : public CompositorAdapter {
    // GNOME Shell-specific D-Bus interfaces
    // org.gnome.Shell, org.gnome.Mutter interfaces
};

class KDEPlasmaAdapter : public CompositorAdapter {
    // KDE Plasma-specific integration
    // KWin scripting, plasma-workspace D-Bus
};

class wlrootsAdapter : public CompositorAdapter {
    // wlr-protocols support for sway, river, etc.
    // wlr-foreign-toplevel-management, wlr-layer-shell
};
```

#### **ScreenshotAnalyzer** - Computer Vision Fallback
```cpp
class ScreenshotAnalyzer {
private:
    std::unique_ptr<OCREngine> ocr_engine_;
    std::unique_ptr<ImageMatcher> image_matcher_;
    
public:
    bool Initialize();
    std::vector<UIElement> AnalyzeScreenshot(const Image& screenshot);
    std::shared_ptr<UIElement> FindElementByText(const std::string& text);
    std::shared_ptr<UIElement> FindElementByImage(const Image& template_image);
    Point FindClickablePoint(const UIElement& element);
};
```

## 🔧 Ключевые компоненты

### 1. Portal-based Discovery

```cpp
std::vector<std::shared_ptr<UIElement>> WaylandUIProvider::DiscoverElementsViaPortals() {
    std::vector<std::shared_ptr<UIElement>> elements;
    
    // Request screen capture via portal
    if (!portal_manager_->RequestPermission("org.freedesktop.portal.ScreenCast", {})) {
        SetLastError("Failed to request screen cast permission");
        return elements;
    }
    
    // Start screen casting
    auto screen_data = portal_manager_->StartScreenCast();
    if (!screen_data) {
        return elements;
    }
    
    // Analyze screenshot for UI elements
    auto screenshot_elements = screenshot_analyzer_->AnalyzeScreenshot(*screen_data);
    
    // Convert to UIElement format
    for (const auto& elem : screenshot_elements) {
        elements.push_back(ConvertToUIElement(elem));
    }
    
    return elements;
}
```

### 2. Compositor Detection

```cpp
std::string WaylandUIProvider::DetectCompositorName() {
    // Check XDG_CURRENT_DESKTOP environment variable
    const char* desktop = getenv("XDG_CURRENT_DESKTOP");
    if (desktop) {
        std::string desktop_str(desktop);
        if (desktop_str.find("GNOME") != std::string::npos) {
            return "gnome-shell";
        } else if (desktop_str.find("KDE") != std::string::npos) {
            return "kwin";
        }
    }
    
    // Check WAYLAND_DISPLAY socket name
    const char* wayland_display = getenv("WAYLAND_DISPLAY");
    if (wayland_display) {
        // Different compositors use different socket naming
    }
    
    // Fallback: Query Wayland registry for compositor info
    // This requires compositor-specific protocols
    
    return "unknown";
}
```

### 3. Input Simulation via Portal

```cpp
bool WaylandUIProvider::SimulateInputViaPortal(const Point& point, const std::string& action) {
    if (!portal_manager_->RequestPermission("org.freedesktop.portal.RemoteDesktop", {})) {
        SetLastError("Failed to request remote desktop permission");
        return false;
    }
    
    if (action == "click") {
        return portal_manager_->SimulateMouseClick(point.x, point.y, 1);
    } else if (action == "type") {
        // Type action requires text parameter
        return false; // Handle in calling code
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
    X11,           ///< X11 Display Server (Linux)
    Wayland        ///< Wayland Display Server (Linux)  // NEW
};
```

### 2. Factory Integration

В `UIProviderFactory::CreateProvider()`:
```cpp
case ProviderType::Wayland:
#ifdef FREERPACAPTURE_HAS_WAYLAND
    return std::make_unique<WaylandUIProvider>();
#else
    throw std::runtime_error("Wayland provider not available - compiled without Wayland support");
#endif
```

### 3. CMake Dependencies

```cmake
# Wayland Display Server support
if(UNIX AND NOT APPLE)
    find_package(PkgConfig)
    if(PkgConfig_FOUND)
        pkg_check_modules(WAYLAND_CLIENT wayland-client)
        pkg_check_modules(WAYLAND_PROTOCOLS wayland-protocols)
        pkg_check_modules(DBUS dbus-1)
        
        if(WAYLAND_CLIENT_FOUND AND DBUS_FOUND)
            message(STATUS "Wayland Display Server support enabled")
            add_compile_definitions(FREERPACAPTURE_HAS_WAYLAND)
            
            # Additional Wayland protocols
            pkg_check_modules(WLR_PROTOCOLS wlr-protocols)
            
        else()
            message(WARNING "Wayland dependencies not found. Install libwayland-dev, libdbus-1-dev")
        endif()
    endif()
endif()
```

## 📁 Файловая структура

```
src/pal/linux/wayland/
├── WaylandUIProvider.h          # Main provider header
├── WaylandUIProvider.cpp        # Main implementation
├── PortalManager.h              # D-Bus portal management
├── PortalManager.cpp            # Portal implementation
├── CompositorAdapter.h          # Base adapter interface
├── GNOMEShellAdapter.cpp        # GNOME Shell integration
├── KDEPlasmaAdapter.cpp         # KDE Plasma integration
├── wlrootsAdapter.cpp           # wlroots-based compositors
└── ScreenshotAnalyzer.h         # CV-based fallback

include/freerpacapture/platform/
├── WaylandTypes.h               # Wayland-specific types
└── PortalTypes.h                # Portal interface types
```

## ⚡ Возможности и ограничения

### ✅ **Поддерживаемые возможности:**
- **Element discovery** через screenshot analysis + OCR
- **Basic interaction** через RemoteDesktop portal (click, type)
- **Screen capture** через ScreenCast portal
- **Compositor detection** и adapter selection
- **Fallback to AT-SPI** для accessibility-aware applications

### ⚠️ **Ограничения Wayland:**
- **Permission prompts**: Пользователь должен одобрить доступ
- **Limited introspection**: Нет прямого доступа к window hierarchy
- **Compositor dependency**: Функциональность зависит от compositor
- **Performance overhead**: Screenshot analysis медленнее прямого API

### 🎯 **Capabilities Definition:**
```cpp
ProviderCapabilities WaylandUIProvider::GetCapabilities() const {
    ProviderCapabilities caps;
    caps.can_enumerate_tree = true;       // ✅ Via screenshot + OCR analysis
    caps.can_get_attributes = true;       // ✅ Via image analysis
    caps.can_highlight = false;           // ⚠️ Limited by Wayland security
    caps.can_interact = true;             // ✅ Via RemoteDesktop portal
    caps.supports_events = false;         // ⚠️ No direct event monitoring
    caps.supports_text_patterns = true;   // ✅ Via OCR
    caps.supports_value_patterns = false; // ⚠️ Limited introspection
    return caps;
}
```

## ✅ Критерии готовности

- [ ] WaylandUIProvider реализует все методы IUIProvider
- [ ] Portal permissions management working
- [ ] Screenshot-based element discovery functional
- [ ] At least one compositor adapter implemented (GNOME/KDE)
- [ ] Basic input simulation через RemoteDesktop portal
- [ ] Fallback to AT-SPI integration
- [ ] CMake configuration для Wayland dependencies
- [ ] Integration tests с real Wayland session

## 🚀 Следующие этапы

1. **PortalManager implementation** (Неделя 1)
2. **Screenshot analysis infrastructure** (Неделя 1-2)  
3. **Basic WaylandUIProvider skeleton** (Неделя 2)
4. **GNOME Shell adapter** (Неделя 2-3)
5. **Input simulation via portals** (Неделя 3-4)
6. **KDE Plasma adapter** (Неделя 4-5)
7. **Testing и optimization** (Неделя 5)

---

**Время выполнения**: 4-5 недель  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ для modern Linux support  
**Зависимости**: libwayland-dev, libdbus-1-dev, wayland-protocols

**Сложность**: HIGH - требует deep understanding Wayland security model и portal system
