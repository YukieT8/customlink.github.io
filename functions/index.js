const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.redirect = functions.https.onRequest(async (req, res) => {
  const path = req.path.split('/')[1]; // Получаем короткий код из URL

  if (!path) {
    // Если путь пустой, показываем главную страницу
    res.sendFile('index.html', { root: 'public' });
    return;
  }

  try {
    // Ищем документ с ID = короткому коду
    const doc = await admin.firestore().collection('links').doc(path).get();
    
    if (!doc.exists) {
      // Если ссылка не найдена, показываем 404
      res.status(404).sendFile('404.html', { root: 'public' });
      return;
    }

    // Обновляем счетчик переходов
    await admin.firestore().collection('links').doc(path).update({
      clicks: admin.firestore.FieldValue.increment(1)
    });

    // Делаем редирект
    res.redirect(301, doc.data().url);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server Error');
  }
});
