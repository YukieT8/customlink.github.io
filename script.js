// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-AsI3pxVWlD9sKTDK8cAzQegt25_wcsA",
  authDomain: "customlink-4ac3e.firebaseapp.com",
  databaseURL: "https://customlink-4ac3e-default-rtdb.firebaseio.com",
  projectId: "customlink-4ac3e",
  storageBucket: "customlink-4ac3e.firebasestorage.app",
  messagingSenderId: "160166926307",
  appId: "1:160166926307:web:bf0ffe10440a5d41c0b2d6",
  measurementId: "G-RT3NB04WNT"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.error("Ошибка инициализации Firebase:", error);
    showNotification("Ошибка подключения к базе данных", "error");
}

const database = firebase.database();
const baseUrl = window.location.origin;

// Функция для показа уведомлений
function showNotification(message, type = "success") {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = 'notification show';
    
    // Устанавливаем цвет в зависимости от типа уведомления
    if (type === "error") {
        notification.style.background = "linear-gradient(135deg, #f72585 0%, #b5179e 100%)";
    } else if (type === "warning") {
        notification.style.background = "linear-gradient(135deg, #fca311 0%, #f77f00 100%)";
    } else {
        notification.style.background = "linear-gradient(135deg, #4cc9f0 0%, #4895ef 100%)";
    }
    
    // Автоматическое скрытие уведомления через 3 секунды
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// Функция для создания ссылки
async function createLink() {
    const originalUrl = document.getElementById('originalUrl').value.trim();
    const customPath = document.getElementById('customPath').value.trim();

    // Валидация URL
    if (!originalUrl) {
        showNotification('Введите URL ссылки', "error");
        document.getElementById('originalUrl').focus();
        return;
    }

    if (!isValidUrl(originalUrl)) {
        showNotification('Введите корректный URL (начинается с http:// или https://)', "error");
        document.getElementById('originalUrl').focus();
        return;
    }

    // Валидация кастомного пути
    if (!customPath) {
        showNotification('Введите название для ссылки', "error");
        document.getElementById('customPath').focus();
        return;
    }

    if (customPath.length < 3) {
        showNotification('Название должно содержать минимум 3 символа', "error");
        document.getElementById('customPath').focus();
        return;
    }

    // Проверка на допустимые символы в пути
    if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        showNotification('Название может содержать только буквы, цифры, дефисы и подчеркивания', "error");
        document.getElementById('customPath').focus();
        return;
    }

    try {
        // Показываем индикатор загрузки
        const createBtn = document.querySelector('.create-btn');
        const originalBtnText = createBtn.innerHTML;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';
        createBtn.disabled = true;
        
        // Проверяем, существует ли уже такой путь
        const snapshot = await database.ref('links/' + customPath).once('value');
        
        if (snapshot.exists()) {
            showNotification('Такое название уже существует! Выберите другое.', "error");
            createBtn.innerHTML = originalBtnText;
            createBtn.disabled = false;
            document.getElementById('customPath').focus();
            return;
        }
        
        // Создаем объект с данными ссылки
        const linkData = {
            original: originalUrl,
            created: new Date().toLocaleString('ru-RU'),
            createdTimestamp: Date.now(),
            clicks: 0
        };

        // Сохраняем в Firebase
        await database.ref('links/' + customPath).set(linkData);
        
        // Показываем созданную ссылку
        displayLink(customPath);
        
        // Обновляем список ссылок
        updateLinksList();
        
        // Очищаем поля ввода
        document.getElementById('originalUrl').value = '';
        document.getElementById('customPath').value = '';
        
        // Показываем уведомление об успехе
        showNotification('Ссылка успешно создана!');
        
        // Восстанавливаем кнопку
        createBtn.innerHTML = originalBtnText;
        createBtn.disabled = false;
        
    } catch (error) {
        console.error('Ошибка при создании ссылки:', error);
        showNotification('Произошла ошибка при создании ссылки', "error");
        
        // Восстанавливаем кнопку в случае ошибки
        const createBtn = document.querySelector('.create-btn');
        createBtn.innerHTML = '<i class="fas fa-magic"></i> Создать ссылку';
        createBtn.disabled = false;
    }
}

// Проверка валидности URL
function isValidUrl(url) {
    try {
        // Добавляем http:// если отсутствует протокол
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
}

// Автодополнение http:// при вводе URL
document.getElementById('originalUrl').addEventListener('blur', function(e) {
    let url = e.target.value.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.includes('://')) {
        e.target.value = 'https://' + url;
    }
});

// Отображение созданной ссылки
function displayLink(path) {
    const linkElement = document.getElementById('shortLink');
    const resultDiv = document.getElementById('result');
    
    // Формируем ссылку с параметром
    const fullLink = `${baseUrl}?link=${encodeURIComponent(path)}`;
    linkElement.href = fullLink;
    linkElement.textContent = fullLink;
    
    resultDiv.style.display = 'block';
    
    // Плавная прокрутка к результату
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Копирование ссылки в буфер обмена
async function copyLink() {
    const linkElement = document.getElementById('shortLink');
    
    try {
        await navigator.clipboard.writeText(linkElement.href);
        showNotification('Ссылка скопирована в буфер обмена!');
        
        // Анимация кнопки копирования
        const copyBtn = document.querySelector('.copy-btn');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
        copyBtn.style.background = 'linear-gradient(135deg, #4cc9f0 0%, #4895ef 100%)';
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать';
            copyBtn.style.background = '';
        }, 2000);
        
    } catch (err) {
        // Fallback для старых браузеров
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = linkElement.href;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showNotification('Ссылка скопирована в буфер обмена!');
    }
}

// Обновление списка созданных ссылок
function updateLinksList() {
    const list = document.getElementById('linksList');
    
    database.ref('links').orderByChild('createdTimestamp').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                list.innerHTML = `
                    <div class="empty-list">
                        <i class="fas fa-link"></i>
                        <p>Ссылок пока нет</p>
                        <small>Создайте свою первую ссылку выше!</small>
                    </div>
                `;
                return;
            }
            
            list.innerHTML = '';
            const links = snapshot.val();
            const linksArray = Object.entries(links);
            
            // Сортируем по дате создания (новые сверху)
            linksArray.sort((a, b) => b[1].createdTimestamp - a[1].createdTimestamp);
            
            // Создаем элементы списка для каждой ссылки
            linksArray.forEach(([key, data]) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="link-info">
                        <a href="${baseUrl}?link=${encodeURIComponent(key)}" target="_blank" title="Перейти по ссылке">
                            ${baseUrl}?link=${key}
                        </a>
                        <div title="${data.original}">→ ${truncateText(data.original, 40)}</div>
                        <small>Создано: ${data.created}</small>
                    </div>
                    <div class="link-actions">
                        <span class="click-count" title="Количество переходов">
                            <i class="fas fa-chart-line"></i> ${data.clicks || 0}
                        </span>
                        <button onclick="copySpecificLink('${key}')" class="copy-small-btn" title="Копировать ссылку">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="deleteLink('${key}')" class="delete-btn" title="Удалить ссылку">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                `;
                list.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error('Ошибка при загрузке ссылок:', error);
            list.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Ошибка загрузки списка ссылок</p>
                    <small>Попробуйте обновить страницу</small>
                </div>
            `;
        });
}

// Копирование конкретной ссылки из списка
async function copySpecificLink(key) {
    const linkToCopy = `${baseUrl}?link=${encodeURIComponent(key)}`;
    
    try {
        await navigator.clipboard.writeText(linkToCopy);
        showNotification('Ссылка скопирована!');
    } catch (err) {
        // Fallback для старых браузеров
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = linkToCopy;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showNotification('Ссылка скопирована!');
    }
}

// Усечение длинного текста
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Удаление ссылки
async function deleteLink(key) {
    if (confirm(`Вы уверены, что хотите удалить ссылку "${key}"?`)) {
        try {
            // Показываем индикатор загрузки
            const deleteBtns = document.querySelectorAll('.delete-btn');
            deleteBtns.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Удаление...';
                btn.disabled = true;
            });
            
            await database.ref('links/' + key).remove();
            updateLinksList();
            showNotification('Ссылка успешно удалена');
            
        } catch (error) {
            console.error('Ошибка при удалении ссылки:', error);
            showNotification('Произошла ошибка при удалении ссылки', "error");
            
            // Восстанавливаем кнопки
            const deleteBtns = document.querySelectorAll('.delete-btn');
            deleteBtns.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-trash"></i> Удалить';
                btn.disabled = false;
            });
        }
    }
}

// Поиск по ссылкам
function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск по ссылкам...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        padding: 12px 20px;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        font-size: 16px;
        width: 100%;
        margin-bottom: 20px;
        background: white;
    `;
    
    const linksListSection = document.querySelector('.links-list');
    linksListSection.insertBefore(searchInput, linksListSection.querySelector('ul'));
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const listItems = document.querySelectorAll('.links-list li');
        
        listItems.forEach(item => {
            const linkText = item.textContent.toLowerCase();
            if (linkText.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Обработка перехода по короткой ссылке
async function handleCustomLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('link');
    
    if (path) {
        try {
            // Показываем загрузку
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; gap: 20px;">
                    <div style="font-size: 3rem; color: #4361ee;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <h2 style="color: #333;">Перенаправление...</h2>
                    <p style="color: #666;">Если перенаправление не произошло, проверьте правильность ссылки</p>
                </div>
            `;
            
            const snapshot = await database.ref('links/' + path).once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Обновляем счетчик переходов
                await database.ref('links/' + path).update({
                    clicks: (data.clicks || 0) + 1
                });
                
                // Перенаправляем на оригинальный URL
                setTimeout(() => {
                    window.location.href = data.original;
                }, 500);
                
            } else {
                // Если ссылка не найдена, возвращаем на главную
                setTimeout(() => {
                    window.location.href = baseUrl;
                }, 2000);
            }
            
        } catch (error) {
            console.error('Ошибка при обработке ссылки:', error);
            setTimeout(() => {
                window.location.href = baseUrl;
            }, 2000);
        }
    } else {
        // Если ссылка не найдена, просто показываем интерфейс
        updateLinksList();
        setupSearch();
        initializeAnimations();
    }
}

// Инициализация анимаций
function initializeAnimations() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
        card.style.opacity = '0';
    });
    
    // Добавляем CSS для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .search-input:focus {
            outline: none;
            border-color: #4361ee;
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }
        
        .copy-small-btn {
            padding: 8px 12px;
            background: #4361ee;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .copy-small-btn:hover {
            background: #3a0ca3;
            transform: translateY(-2px);
        }
        
        .link-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
}

// Обработчики событий для клавиши Enter
document.getElementById('originalUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('customPath').focus();
    }
});

document.getElementById('customPath').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        createLink();
    }
});

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    // Если это переход по короткой ссылке - обрабатываем его
    if (window.location.search.includes('link=')) {
        handleCustomLink();
    } else {
        updateLinksList();
        setupSearch();
        initializeAnimations();
    }
});

// Service Worker для оффлайн-работы (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Обработка ошибок Firebase
database.ref('.info/connected').on('value', function(snapshot) {
    if (snapshot.val() === true) {
        console.log('Connected to Firebase');
    } else {
        console.log('Disconnected from Firebase');
        showNotification('Нет соединения с сервером', "warning");
    }
});

// Экспорт функций для глобального использования
window.createLink = createLink;
window.copyLink = copyLink;
window.deleteLink = deleteLink;
window.copySpecificLink = copySpecificLink;
