// Конфигурация Firebase
const firebaseConfig = {
    // ЗАМЕНИТЕ ЭТИ ДАННЫЕ НА ВАШИ ИЗ КОНСОЛИ FIREBASE
    apiKey: "ВАШ_API_KEY",
    authDomain: "ВАШ_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://ВАШ_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "ВАШ_PROJECT_ID",
    storageBucket: "ВАШ_PROJECT_ID.appspot.com",
    messagingSenderId: "ВАШ_SENDER_ID",
    appId: "ВАШ_APP_ID"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.error("Ошибка инициализации Firebase:", error);
}

const database = firebase.database();
const baseUrl = window.location.origin;

// Функция для создания ссылки
async function createLink() {
    const originalUrl = document.getElementById('originalUrl').value;
    const customPath = document.getElementById('customPath').value;

    if (!isValidUrl(originalUrl)) {
        alert('Введите корректный URL (начинается с http:// или https://)');
        return;
    }

    if (!customPath) {
        alert('Введите название для ссылки');
        return;
    }

    // Проверка на допустимые символы в пути
    if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        alert('Название может содержать только буквы, цифры, дефисы и подчеркивания');
        return;
    }

    try {
        // Проверяем, существует ли уже такой путь
        const snapshot = await database.ref('links/' + customPath).once('value');
        
        if (snapshot.exists()) {
            alert('Такое название уже существует! Выберите другое.');
            return;
        }
        
        // Создаем объект с данными ссылки
        const linkData = {
            original: originalUrl,
            created: new Date().toLocaleString('ru-RU'),
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
        
    } catch (error) {
        console.error('Ошибка при создании ссылки:', error);
        alert('Произошла ошибка при создании ссылки');
    }
}

// Проверка валидности URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Отображение созданной ссылки
function displayLink(path) {
    const linkElement = document.getElementById('shortLink');
    const resultDiv = document.getElementById('result');
    
    // Формируем ссылку с путем
    const fullLink = `${baseUrl}?link=${encodeURIComponent(path)}`;
    linkElement.href = fullLink;
    linkElement.textContent = fullLink;
    
    resultDiv.style.display = 'block';
}

// Копирование ссылки в буфер обмена
function copyLink() {
    const linkElement = document.getElementById('shortLink');
    const tempInput = document.createElement('input');
    
    document.body.appendChild(tempInput);
    tempInput.value = linkElement.href;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert('Ссылка скопирована в буфер обмена!');
}

// Обновление списка созданных ссылок
function updateLinksList() {
    const list = document.getElementById('linksList');
    
    database.ref('links').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                list.innerHTML = '<div class="empty-list">Ссылок пока нет</div>';
                return;
            }
            
            list.innerHTML = '';
            const links = snapshot.val();
            
            // Создаем элементы списка для каждой ссылки
            Object.keys(links).forEach((key) => {
                const data = links[key];
                
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="link-info">
                        <a href="${baseUrl}?link=${encodeURIComponent(key)}" target="_blank">${baseUrl}?link=${key}</a>
                        <div>→ ${data.original}</div>
                        <small>Создано: ${data.created} | Переходов: ${data.clicks || 0}</small>
                    </div>
                    <button onclick="deleteLink('${key}')" class="delete-btn">Удалить</button>
                `;
                list.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error('Ошибка при загрузке ссылок:', error);
            list.innerHTML = '<div class="empty-list">Ошибка загрузки списка ссылок</div>';
        });
}

// Удаление ссылки
async function deleteLink(key) {
    if (confirm('Вы уверены, что хотите удалить эту ссылку?')) {
        try {
            await database.ref('links/' + key).remove();
            updateLinksList();
        } catch (error) {
            console.error('Ошибка при удалении ссылки:', error);
            alert('Произошла ошибка при удалении ссылки');
        }
    }
}

// Обработка перехода по короткой ссылке
async function handleCustomLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('link');
    
    if (path) {
        try {
            const snapshot = await database.ref('links/' + path).once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Обновляем счетчик переходов
                await database.ref('links/' + path).update({
                    clicks: (data.clicks || 0) + 1
                });
                
                // Перенаправляем на оригинальный URL
                window.location.href = data.original;
                return;
            }
        } catch (error) {
            console.error('Ошибка при обработке ссылки:', error);
        }
    }
    
    // Если ссылка не найдена, просто показываем интерфейс
    updateLinksList();
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    // Если это переход по короткой ссылке - обрабатываем его
    handleCustomLink();
});
