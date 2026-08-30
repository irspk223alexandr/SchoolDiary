const db = require('../config/db');

// Генерация случайного пароля (8 символов: буквы+цифры)
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Генерация уникального логина на основе ФИО
async function generateLogin(lastName, firstName, middleName) {
  // Основа: транслитерация или просто первые буквы
  // Для простоты возьмём латиницу (можно сделать транслитерацию позже)
  const base = (lastName + firstName.charAt(0) + (middleName ? middleName.charAt(0) : '')).toLowerCase();
  // Заменяем кириллицу на латиницу (примитивно)
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  let login = '';
  for (let ch of base) {
    login += translitMap[ch] || ch;
  }
  // Убираем небуквенные символы
  login = login.replace(/[^a-z]/g, '');
  
  // Проверяем уникальность
  let candidate = login;
  let counter = 1;
  while (true) {
    const exists = await db('users').where('login', candidate).first();
    if (!exists) return candidate;
    candidate = login + counter;
    counter++;
  }
}

module.exports = {
  generatePassword,
  generateLogin
};