// Тест iOS функций для English Learning App
console.log('🍎 iOS Functions Test Script загружен');

// Эмуляция iPhone User Agent
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
    get: function() {
        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    }
});

// Функция для тестирования iOS определения
function testIOSDetection() {
    console.log('🔍 Тестирование определения iOS...');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log(`iOS определен: ${isIOS}`);
    console.log(`User Agent: ${navigator.userAgent}`);
    return isIOS;
}

// Функция для тестирования localStorage
function testLocalStorage() {
    console.log('💾 Тестирование localStorage...');
    try {
        const testKey = 'ios-test-' + Date.now();
        const testValue = 'test-value';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
            console.log('✅ localStorage работает корректно');
            return true;
        } else {
            console.log('❌ localStorage работает некорректно');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка localStorage:', error);
        return false;
    }
}

// Функция для тестирования кэша
async function testCache() {
    console.log('🗂️ Тестирование кэша...');
    if ('caches' in window) {
        try {
            const names = await caches.keys();
            console.log(`Найдено кэшей: ${names.length}`);
            names.forEach(name => {
                console.log(`  - ${name}`);
            });
            return names.length;
        } catch (error) {
            console.error('❌ Ошибка кэша:', error);
            return 0;
        }
    } else {
        console.log('❌ Cache API не поддерживается');
        return 0;
    }
}

// Функция для тестирования Firebase
function testFirebase() {
    console.log('🔥 Тестирование Firebase...');
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        console.log('✅ Firebase доступен и инициализирован');
        return true;
    } else {
        console.log('❌ Firebase не загружен или не инициализирован');
        return false;
    }
}

// Функция для тестирования Service Worker
async function testServiceWorker() {
    console.log('🔧 Тестирование Service Worker...');
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Найдено Service Worker: ${registrations.length}`);
            registrations.forEach((registration, index) => {
                console.log(`  - SW ${index + 1}: ${registration.scope}`);
            });
            return registrations.length;
        } catch (error) {
            console.error('❌ Ошибка Service Worker:', error);
            return 0;
        }
    } else {
        console.log('❌ Service Worker не поддерживается');
        return 0;
    }
}

// Функция для тестирования iOS инициализации
async function testIOSInitialization() {
    console.log('🍎 Тестирование iOS инициализации...');
    
    const results = {
        isIOS: testIOSDetection(),
        localStorage: testLocalStorage(),
        cache: await testCache(),
        firebase: testFirebase(),
        serviceWorker: await testServiceWorker()
    };
    
    console.log('📊 Результаты тестирования:', results);
    
    // Эмулируем iOS инициализацию
    if (results.isIOS) {
        console.log('🍎 Запуск iOS инициализации...');
        
        // Очистка localStorage
        const keysToRemove = [
            'englishLearningData',
            'current-user',
            'has-synced-before',
            'ios_last_update',
            'app-version',
            'last-backup-time'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Удален ключ: ${key}`);
        });
        
        // Очистка кэша
        if (results.cache > 0) {
            const names = await caches.keys();
            for (const name of names) {
                await caches.delete(name);
                console.log(`🗑️ Удален кэш: ${name}`);
            }
        }
        
        console.log('✅ iOS инициализация завершена');
    }
    
    return results;
}

// Автоматический запуск тестов
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Запуск автоматических тестов iOS...');
    await testIOSInitialization();
});

// Экспорт функций для использования в консоли
window.testIOS = {
    detection: testIOSDetection,
    localStorage: testLocalStorage,
    cache: testCache,
    firebase: testFirebase,
    serviceWorker: testServiceWorker,
    initialization: testIOSInitialization
};

console.log('🍎 iOS тестовые функции доступны в window.testIOS');
