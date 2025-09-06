// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-AsI3pxVWlD9sKTDK8cAzQegt25_wcsA",
  authDomain: "customlink-4ac3e.firebaseapp.com",
  projectId: "customlink-4ac3e",
  storageBucket: "customlink-4ac3e.firebasestorage.app",
  messagingSenderId: "160166926307",
  appId: "1:160166926307:web:bf0ffe10440a5d41c0b2d6",
};
// Инициализация Firebase
try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  console.error("Ошибка инициализации Firebase:", error);
  showNotification("Ошибка подключения к базе данных", "error");
}

// Инициализация Firestore
const db = firebase.firestore();
const baseUrl = "https://your-custom-domain.com"; // ЗАМЕНИТЕ на ваш домен

// Функция для показа уведомлений
function showNotification(message, type = "success") {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');
  
  notificationText.textContent = message;
  notification.className = 'notification show';
  
  if (type === "error") {
    notification.style.background = "linear-gradient(135deg, #f72585 0%, #b5179e 100%)";
  } else if (type === "warning") {
    notification.style.background = "linear-gradient(135deg, #fca311 0%, #f77f00 100%)";
  } else {
    notification.style.background = "linear-gradient(135deg, #4cc9f0 0%, #4895ef 100%)";
  }
  
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

  if (customPath.length < 2) {
    showNotification('Название должно содержать минимум 2 символа', "error");
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
    const doc = await db.collection('links').doc(customPath).get();
    
    if (doc.exists) {
      showNotification('Такое название уже существует! Выберите другое.', "error");
      createBtn.innerHTML = originalBtnText;
      createBtn.disabled = false;
      document.getElementById('customPath').focus();
      return;
    }
    
    // Создаем объект с данными ссылки
    const linkData = {
      url: originalUrl,
      createdAt: new Date(),
      clicks: 0
    };

    // Сохраняем в Firestore
    await db.collection('links').doc(customPath).set(linkData);
    
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
  
  // Формируем короткую ссылку
  const fullLink = `${baseUrl}/${path}`;
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
  
  db.collection('links').orderBy('createdAt', 'desc').get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
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
      
      // Создаем элементы списка для каждой ссылки
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <div class="link-info">
            <a href="${baseUrl}/${doc.id}" target="_blank" title="Перейти по ссылке">
              ${baseUrl}/${doc.id}
            </a>
            <div title="${data.url}">→ ${truncateText(data.url, 40)}</div>
            <small>Создано: ${data.createdAt.toDate().toLocaleString('ru-RU')}</small>
          </div>
          <div class="link-actions">
            <span class="click-count" title="Количество переходов">
              <i class="fas fa-chart-line"></i> ${data.clicks || 0}
            </span>
            <button onclick="copySpecificLink('${doc.id}')" class="copy-small-btn" title="Копировать ссылку">
              <i class="fas fa-copy"></i>
            </button>
            <button onclick="deleteLink('${doc.id}')" class="delete-btn" title="Удалить ссылку">
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
  const linkToCopy = `${baseUrl}/${key}`;
  
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
      
      await db.collection('links').doc(key).delete();
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
  updateLinksList();
  setupSearch();
  initializeAnimations();
});

// Экспорт функций для глобального использования
window.createLink = createLink;
window.copyLink = copyLink;
window.deleteLink = deleteLink;
window.copySpecificLink = copySpecificLink;
