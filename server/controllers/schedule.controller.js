const db = require('../config/db');
const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const updateLocale = require('dayjs/plugin/updateLocale');
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
  weekStart: 1
});

// Получить расписание для недели (собирается из шаблона)
exports.getSchedule = async (req, res) => {
  try {
    const { class_id, week } = req.query;
    
    let targetClassId = class_id;
    
    if (!targetClassId) {
      const user = await db('users').where({ id: req.userId }).first();
      if (user) targetClassId = user.class_id;
    }
    
    if (!targetClassId) {
      return res.json({ schedule: [], week: { start: null, end: null }, class_id: null });
    }
    
    // Определяем неделю
    let startOfWeek;
if (week) {
  startOfWeek = dayjs(week).startOf('week');
} else {
  startOfWeek = dayjs().startOf('week');
}
    const startDate = startOfWeek.format('YYYY-MM-DD');
    const endDate = startOfWeek.add(6, 'day').format('YYYY-MM-DD');
    
    // Получаем шаблон для класса
    const templates = await db('schedule_templates')
      .join('subjects', 'schedule_templates.subject_id', 'subjects.id')
      .join('users', 'schedule_templates.teacher_id', 'users.id')
      .where('schedule_templates.class_id', targetClassId)
      .select(
        'schedule_templates.*',
        'subjects.name as subject_name',
        db.raw("CONCAT(users.last_name, ' ', users.first_name, ' ', users.middle_name) as teacher_name")
      )
      .orderBy('schedule_templates.day_of_week', 'asc')
      .orderBy('schedule_templates.lesson_number', 'asc');
    
    // Преобразуем шаблон в расписание на неделю
    const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const schedule = [];
    
    templates.forEach(template => {
      const dayIndex = weekDays.indexOf(template.day_of_week);
      if (dayIndex !== -1) {
        const date = startOfWeek.add(dayIndex, 'day').format('YYYY-MM-DD');
        schedule.push({
          id: template.id,
          date: date,
          day_of_week: template.day_of_week,
          lesson_number: template.lesson_number,
          subject_id: template.subject_id,
          subject_name: template.subject_name,
          teacher_id: template.teacher_id,
          teacher_name: template.teacher_name,
          class_id: template.class_id,
          homework: template.homework || '',
          is_template: true
        });
      }
    });
    
    res.json({
      schedule,
      week: {
        start: startDate,
        end: endDate
      },
      class_id: targetClassId
    });
  } catch (err) {
    console.error('Ошибка получения расписания:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить шаблон расписания для класса
exports.getScheduleTemplate = async (req, res) => {
  const { class_id } = req.query;
  if (!class_id) {
    return res.status(400).json({ message: 'Не указан класс' });
  }
  try {
    const templates = await db('schedule_templates')
      .join('subjects', 'schedule_templates.subject_id', 'subjects.id')
      .join('users', 'schedule_templates.teacher_id', 'users.id')
      .where('schedule_templates.class_id', class_id)
      .select(
        'schedule_templates.*',
        'subjects.name as subject_name',
        db.raw("CONCAT(users.last_name, ' ', users.first_name, ' ', users.middle_name) as teacher_name")
      )
      .orderBy('schedule_templates.day_of_week', 'asc')
      .orderBy('schedule_templates.lesson_number', 'asc');
    
    res.json(templates);
  } catch (err) {
    console.error('Ошибка получения шаблона:', err);
    res.status(500).json({ error: err.message });
  }
};

// Сохранить шаблон расписания (недельное)
exports.saveScheduleTemplate = async (req, res) => {
  const { class_id, lessons } = req.body;
  if (!class_id) {
    return res.status(400).json({ message: 'Не указан класс' });
  }
  try {
    // Удаляем старые шаблоны для класса
    await db('schedule_templates').where('class_id', class_id).del();
    
    // Сохраняем новые
    if (lessons && lessons.length > 0) {
      const templates = lessons.map(lesson => ({
        class_id: class_id,
        subject_id: lesson.subject_id,
        teacher_id: lesson.teacher_id,
        lesson_number: lesson.lesson_number,
        day_of_week: lesson.day_of_week,
        homework: lesson.homework || '',
        created_at: new Date(),
        updated_at: new Date()
      }));
      await db('schedule_templates').insert(templates);
    }
    
    res.json({ message: 'Расписание сохранено' });
  } catch (err) {
    console.error('Ошибка сохранения шаблона:', err);
    res.status(500).json({ error: err.message });
  }
};

// Добавить один урок в шаблон
exports.addTemplateItem = async (req, res) => {
  const { class_id, subject_id, teacher_id, lesson_number, day_of_week, homework } = req.body;
  if (!class_id || !subject_id || !teacher_id || !lesson_number || !day_of_week) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }
  try {
    // Проверяем конфликт
    const conflict = await db('schedule_templates')
      .where({ class_id, day_of_week, lesson_number })
      .first();
    if (conflict) {
      return res.status(409).json({ message: 'В это время уже есть урок' });
    }
    
    const [id] = await db('schedule_templates').insert({
      class_id,
      subject_id,
      teacher_id,
      lesson_number,
      day_of_week,
      homework: homework || '',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    res.json({ message: 'Урок добавлен', id });
  } catch (err) {
    console.error('Ошибка добавления урока:', err);
    res.status(500).json({ error: err.message });
  }
};

// Удалить урок из шаблона
exports.deleteTemplateItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db('schedule_templates').where('id', id).del();
    res.json({ message: 'Урок удалён' });
  } catch (err) {
    console.error('Ошибка удаления урока:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить предметы
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await db('subjects').select('*').orderBy('name', 'asc');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Обновить домашнее задание у урока
exports.updateHomework = async (req, res) => {
  const { id } = req.params;
  const { homework } = req.body;
  const userId = req.userId;

  try {
    // Получаем урок
    const lesson = await db('schedule_templates')
      .where({ id })
      .first();

    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Проверяем права: учитель может редактировать только свои предметы
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .pluck('roles.name');

    const isDirector = roles.includes('Директор');
    const isTeacher = roles.includes('Преподаватель');

    if (isTeacher) {
      // Проверяем, что учитель ведёт этот предмет у этого класса
      const ownLesson = await db('schedule_templates')
        .where({
          id,
          teacher_id: userId
        })
        .first();

      if (!ownLesson) {
        return res.status(403).json({ 
          message: 'Вы можете редактировать ДЗ только по своим предметам' 
        });
      }
    }

    // Обновляем ДЗ
    await db('schedule_templates')
      .where({ id })
      .update({ 
        homework: homework || '',
        updated_at: new Date()
      });

    res.json({ message: 'Домашнее задание обновлено' });
  } catch (err) {
    console.error('Ошибка обновления ДЗ:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить ДЗ для урока на конкретную дату
const getHomeworkForDate = async (templateId, date) => {
  const homework = await db('homework')
    .where({ schedule_template_id: templateId, date })
    .first();
  return homework ? homework.content : null;
};

// Получить ДЗ для всех уроков на неделю (добавляем в getSchedule)
// Измените метод getSchedule, добавив подгрузку ДЗ:
exports.getSchedule = async (req, res) => {
  try {
    const { class_id, week } = req.query;
    
    let targetClassId = class_id;
    
    if (!targetClassId) {
      const user = await db('users').where({ id: req.userId }).first();
      if (user) targetClassId = user.class_id;
    }
    
    if (!targetClassId) {
      return res.json({ schedule: [], week: { start: null, end: null }, class_id: null });
    }
    
    let startOfWeek;
    if (week) {
      startOfWeek = dayjs(week).startOf('week');
    } else {
      startOfWeek = dayjs().startOf('week');
    }
    const startDate = startOfWeek.format('YYYY-MM-DD');
    const endDate = startOfWeek.add(6, 'day').format('YYYY-MM-DD');
    
    // Получаем шаблон для класса
    const templates = await db('schedule_templates')
      .join('subjects', 'schedule_templates.subject_id', 'subjects.id')
      .join('users', 'schedule_templates.teacher_id', 'users.id')
      .where('schedule_templates.class_id', targetClassId)
      .select(
        'schedule_templates.*',
        'subjects.name as subject_name',
        db.raw("CONCAT(users.last_name, ' ', users.first_name, ' ', users.middle_name) as teacher_name")
      )
      .orderBy('schedule_templates.day_of_week', 'asc')
      .orderBy('schedule_templates.lesson_number', 'asc');
    
    // Преобразуем шаблон в расписание на неделю и подгружаем ДЗ
    const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const schedule = [];
    
    for (const template of templates) {
      const dayIndex = weekDays.indexOf(template.day_of_week);
      if (dayIndex !== -1) {
        const date = startOfWeek.add(dayIndex, 'day').format('YYYY-MM-DD');
        // Получаем ДЗ на эту дату
        const homework = await getHomeworkForDate(template.id, date);
        schedule.push({
          id: template.id,
          date: date,
          day_of_week: template.day_of_week,
          lesson_number: template.lesson_number,
          subject_id: template.subject_id,
          subject_name: template.subject_name,
          teacher_id: template.teacher_id,
          teacher_name: template.teacher_name,
          class_id: template.class_id,
          homework: homework || '', // ДЗ на конкретную дату
          is_template: true
        });
      }
    }
    
    res.json({
      schedule,
      week: {
        start: startDate,
        end: endDate
      },
      class_id: targetClassId
    });
  } catch (err) {
    console.error('Ошибка получения расписания:', err);
    res.status(500).json({ error: err.message });
  }
};

// Сохранить ДЗ на конкретную дату
exports.saveHomework = async (req, res) => {
  const { id } = req.params; // schedule_template_id
  const { date, content } = req.body;
  const userId = req.userId;

  if (!date || content === undefined) {
    return res.status(400).json({ message: 'Дата и содержание ДЗ обязательны' });
  }

  try {
    // Проверяем, существует ли урок
    const lesson = await db('schedule_templates')
      .where({ id })
      .first();

    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Проверяем права: учитель может редактировать только свои предметы
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .pluck('roles.name');

    const isDirector = roles.includes('Директор');
    const isTeacher = roles.includes('Преподаватель');

    if (isTeacher) {
      const ownLesson = await db('schedule_templates')
        .where({ id, teacher_id: userId })
        .first();
      if (!ownLesson) {
        return res.status(403).json({ 
          message: 'Вы можете редактировать ДЗ только по своим предметам' 
        });
      }
    }

    // Сохраняем или обновляем ДЗ
    await db('homework')
      .insert({
        schedule_template_id: id,
        date: date,
        content: content || null
      })
      .onConflict(['schedule_template_id', 'date'])
      .merge(['content', 'updated_at']);

    res.json({ message: 'Домашнее задание сохранено' });
  } catch (err) {
    console.error('Ошибка сохранения ДЗ:', err);
    res.status(500).json({ error: err.message });
  }
};

// Удалить ДЗ на конкретную дату
exports.deleteHomework = async (req, res) => {
  const { id } = req.params; // schedule_template_id
  const { date } = req.query;

  try {
    await db('homework')
      .where({ schedule_template_id: id, date })
      .del();
    res.json({ message: 'Домашнее задание удалено' });
  } catch (err) {
    console.error('Ошибка удаления ДЗ:', err);
    res.status(500).json({ error: err.message });
  }
};