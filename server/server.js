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
const db = require('./config/db');
const dayjs = require('dayjs');
const lessonTimesRoutes = require('./routes/lessonTimes.routes');

const app = express();
const gradesRoutes = require('./routes/grades.routes');
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/lesson-times', lessonTimesRoutes);

// Статика для аватаров
app.use('/uploads', express.static(path.join(__dirname, 'uploads/avatars')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/grades', gradesRoutes);


// Функция очистки старых ДЗ
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
  
  // Запускаем очистку сразу при старте сервера
  cleanupOldHomework();
  
  // И дальше каждые 24 часа
  setInterval(cleanupOldHomework, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));