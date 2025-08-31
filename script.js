const baseUrl = window.location.origin;

// Функция для создания ссылки
function createLink() {
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

    // Создаем объект с данными ссылки
    const linkData = {
        original: originalUrl,
        created: new Date().toLocaleString('ru-RU')
    };

    // Сохраняем в localStorage
    localStorage.setItem(customPath, JSON.stringify(linkData));
    
    // Показываем созданную ссылку
    displayLink(customPath);
    
    // Обновляем список ссылок
    updateLinksList();
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
    const fullLink = `${baseUrl}/${encodeURIComponent(path)}`;
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
    list.innerHTML = '';
    
    if (localStorage.length === 0) {
        list.innerHTML = '<div class="empty-list">Ссылок пока нет</div>';
        return;
    }
    
    // Создаем элементы списка для каждой ссылки
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === null) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="link-info">
                    <a href="${baseUrl}/${encodeURIComponent(key)}" target="_blank">${baseUrl}/${key}</a>
                    <div>→ ${data.original}</div>
                    <small>Создано: ${data.created}</small>
                </div>
                <button onclick="deleteLink('${key}')" class="delete-btn">Удалить</button>
            `;
            list.appendChild(listItem);
        } catch (e) {
            console.error('Ошибка при обработке элемента localStorage:', e);
        }
    }
}

// Удаление ссылки
function deleteLink(key) {
    if (confirm('Вы уверены, что хотите удалить эту ссылку?')) {
        localStorage.removeItem(key);
        updateLinksList();
    }
}

// Обработка перехода по короткой ссылке
function handleCustomLink() {
    const path = window.location.pathname.substring(1); // Получаем путь без первого слеша
    
    if (path) {
        try {
            const decodedPath = decodeURIComponent(path);
            const data = JSON.parse(localStorage.getItem(decodedPath));
            
            if (data) {
                // Перенаправляем на оригинальный URL
                window.location.href = data.original;
                return;
            }
        } catch (e) {
            console.error('Ошибка при обработке ссылки:', e);
        }
    }
    
    // Если ссылка не найдена, просто показываем интерфейс
    updateLinksList();
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    // Если это переход по короткой ссылке - обрабатываем его
    if (window.location.pathname !== '/') {
        handleCustomLink();
    } else {
        updateLinksList();
    }
});
