const db = require('../config/db');

// Получить все настройки времени
exports.getAll = async (req, res) => {
  try {
    const times = await db('lesson_times').select('*').orderBy('lesson_number', 'asc');
    res.json(times);
  } catch (err) {
    console.error('Ошибка получения времени уроков:', err);
    res.status(500).json({ error: err.message });
  }
};

// Проверка пересечения интервалов
function hasOverlap(lessons, currentLessonNumber) {
  // Сортируем по start_time
  const sorted = [...lessons].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    // Если конец текущего > начало следующего — пересечение
    if (current.end_time > next.start_time) {
      // Проверяем, не является ли это пересечение с самим собой (если урок с таким же номером)
      if (current.lesson_number !== currentLessonNumber && next.lesson_number !== currentLessonNumber) {
        return true;
      }
    }
  }
  return false;
}

// Обновить время урока
exports.update = async (req, res) => {
  const { lesson_number, start_time, end_time } = req.body;
  
  if (lesson_number === undefined || !start_time || !end_time) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  // 1. Проверяем, что начало < окончание
  if (start_time >= end_time) {
    return res.status(400).json({ message: 'Время начала должно быть меньше времени окончания' });
  }

  try {
    // Проверяем, существует ли запись
    const exists = await db('lesson_times')
      .where({ lesson_number })
      .first();
    
    if (!exists) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    // Получаем все уроки (кроме текущего)
    const allLessons = await db('lesson_times')
      .select('*')
      .whereNot('lesson_number', lesson_number);

    // Добавляем текущий урок с новым временем для проверки
    const lessonsForCheck = [
      ...allLessons,
      { lesson_number, start_time, end_time }
    ];

    // 2. Проверяем пересечения
    if (hasOverlap(lessonsForCheck, lesson_number)) {
      return res.status(400).json({ 
        message: 'Время уроков пересекаются. Пожалуйста, скорректируйте время.' 
      });
    }

    // Обновляем
    await db('lesson_times')
      .where({ lesson_number })
      .update({
        start_time,
        end_time,
        updated_at: new Date()
      });

    // Возвращаем обновлённую запись
    const updated = await db('lesson_times')
      .where({ lesson_number })
      .first();

    res.json({ message: 'Время урока обновлено', data: updated });
  } catch (err) {
    console.error('Ошибка обновления времени урока:', err);
    res.status(500).json({ error: err.message });
  }
};