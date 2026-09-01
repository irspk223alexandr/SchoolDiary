require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const teacherRoutes = require('./routes/teacher.routes');
const directorRoutes = require('./routes/director.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const progressRoutes = require('./routes/progress.routes');
const lessonTimesRoutes = require('./routes/lessonTimes.routes');
const gradesRoutes = require('./routes/grades.routes');
const db = require('./config/db');
const dayjs = require('dayjs');

const app = express();

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// ✅ ИСПРАВЛЕННЫЙ CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://school-diary-six.vercel.app',
  'https://schooldiary-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Блокировка CORS для:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// Статика для аватаров
app.use('/uploads', express.static(path.join(__dirname, 'uploads/avatars')));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/lesson-times', lessonTimesRoutes);

// Очистка старых ДЗ
const cleanupOldHomework = async () => {
  try {
    const threeWeeksAgo = dayjs().subtract(21, 'day').format('YYYY-MM-DD');
    const deleted = await db('homework')
      .where('date', '<', threeWeeksAgo)
      .del();
    if (deleted > 0) {
      console.log(`✅ Очистка ДЗ: удалено ${deleted} записей старше 3 недель`);
    }
  } catch (err) {
    console.error('❌ Ошибка очистки ДЗ:', err.message);
  }
};

cleanupOldHomework();
setInterval(cleanupOldHomework, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
