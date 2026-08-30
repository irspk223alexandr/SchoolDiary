const db = require('../config/db');
const dayjs = require('dayjs');

// Получение ролей пользователя
async function getUserRoles(userId) {
  const roles = await db('roles')
    .join('user_roles', 'roles.id', 'user_roles.role_id')
    .where('user_roles.user_id', userId)
    .pluck('roles.name');
  return roles;
}

// Проверка прав на изменение/удаление (только учитель или директор)
async function checkTeacherAccess(userId, scheduleId) {
  const roles = await getUserRoles(userId);
  if (roles.includes('Директор')) return true;
  if (!roles.includes('Преподаватель')) return false;

  const template = await db('schedule_templates')
    .where('id', scheduleId)
    .first();

  if (!template) return false;
  return template.teacher_id === userId;
}

// Получить данные для таблицы оценок
exports.getGrades = async (req, res) => {
  const { class_id, subject_id, month, quarter = 1 } = req.query;
  
  console.log('📥 ===== НАЧАЛО ЗАПРОСА ОЦЕНОК =====');
  console.log('📥 Параметры:', { class_id, subject_id, month, quarter });
  
  if (!subject_id) {
    return res.status(400).json({ message: 'Не выбран предмет' });
  }

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'Неверный формат месяца. Используйте YYYY-MM' });
  }

  const startDate = dayjs(month || undefined).startOf('month').format('YYYY-MM-DD');
  const endDate = dayjs(month || undefined).endOf('month').format('YYYY-MM-DD');
  console.log('📅 Период:', { startDate, endDate });

  try {
    // Определяем роль текущего пользователя
    const roles = await getUserRoles(req.userId);
    const isStudent = roles.includes('Ученик');
    const isTeacher = roles.includes('Преподаватель');
    const isDirector = roles.includes('Директор');

    if (!isStudent && !isTeacher && !isDirector) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    let effectiveClassId = class_id;
    
    // Если ученик – берём его класс из профиля, игнорируем переданный class_id
    if (isStudent) {
      const user = await db('users')
        .where('id', req.userId)
        .select('class_id')
        .first();
      
      if (!user || !user.class_id) {
        return res.status(400).json({ message: 'Ученик не привязан к классу' });
      }
      effectiveClassId = user.class_id;
    }

    if (!effectiveClassId) {
      return res.status(400).json({ message: 'Не выбран класс' });
    }

    // Проверяем, есть ли шаблоны уроков для этого класса и предмета
    const templates = await db('schedule_templates')
      .where('class_id', effectiveClassId)
      .andWhere('subject_id', subject_id)
      .select('id', 'day_of_week', 'lesson_number')
      .orderBy('day_of_week', 'asc')
      .orderBy('lesson_number', 'asc');

    if (templates.length === 0) {
      return res.json({ students: [], lessons: [], grades: [] });
    }

    // Получаем учеников
    let students = [];
    if (isStudent) {
      // Для ученика – только он сам
      const user = await db('users')
        .where('id', req.userId)
        .select('id', 'last_name', 'first_name', 'middle_name')
        .first();
      if (user) students = [user];
    } else {
      // Для учителя/директора – все ученики класса
      students = await db('users')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .where('users.class_id', effectiveClassId)
        .andWhere('user_roles.role_id', 1) // предполагаем, что role_id ученика = 1
        .select('users.id', 'users.last_name', 'users.first_name', 'users.middle_name')
        .orderBy('users.last_name', 'asc');
    }

    console.log('👨‍🎓 Найдено учеников:', students.length);
    if (students.length === 0) {
      return res.json({ students: [], lessons: [], grades: [] });
    }

    // Генерируем уроки на месяц
    const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const lessons = [];

    let currentDate = dayjs(startDate);
    while (currentDate <= dayjs(endDate)) {
      const dayName = weekDays[currentDate.day() === 0 ? 6 : currentDate.day() - 1];
      const dayTemplates = templates.filter(t => t.day_of_week === dayName);
      for (const template of dayTemplates) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        lessons.push({
          schedule_id: template.id,
          date: dateStr,
          lesson_number: template.lesson_number,
          date_display: currentDate.format('DD.MM')
        });
      }
      currentDate = currentDate.add(1, 'day');
    }

    // Получаем оценки
    let grades = [];
    if (students.length > 0 && lessons.length > 0) {
      const studentIds = students.map(s => s.id);
      
      grades = await db('grades')
        .whereIn('student_id', studentIds)
        .andWhere('subject_id', subject_id)
        .andWhere('quarter', quarter)
        .whereBetween('date', [startDate, endDate])
        .select('student_id', 'schedule_id', 'date', 'grade');

      grades = grades.map(g => ({
        ...g,
        date: dayjs(g.date).format('YYYY-MM-DD')
      }));
      
      console.log('✅ Найдено оценок:', grades.length);
    }

    const response = { 
      students, 
      lessons: lessons.map(l => ({
        schedule_id: l.schedule_id,
        date: l.date,
        lesson_number: l.lesson_number,
        date_display: l.date_display
      })),
      grades 
    };
    
    console.log('📤 Ответ: учеников=', response.students.length, 
                'уроков=', response.lessons.length, 
                'оценок=', response.grades.length);
    console.log('📤 ===== КОНЕЦ ЗАПРОСА =====');
    
    res.json(response);
  } catch (err) {
    console.error('❌ ОШИБКА:', err);
    res.status(500).json({ error: err.message });
  }
};

// Сохранить оценку (доступно только учителю/директору)
exports.setGrade = async (req, res) => {
  let { student_id, schedule_id, date, grade, quarter = 1, comment = '' } = req.body;
  
  const dateOnly = dayjs(date).format('YYYY-MM-DD');
  
  grade = parseInt(grade);
  
  if (!student_id || !schedule_id || !dateOnly || isNaN(grade)) {
    return res.status(400).json({ message: 'Не все поля заполнены' });
  }
  
  if (grade < 1 || grade > 5) {
    return res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
  }

  try {
    const hasAccess = await checkTeacherAccess(req.userId, schedule_id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'У вас нет прав на изменение этой оценки' });
    }

    const template = await db('schedule_templates')
      .where('id', schedule_id)
      .first();
    
    if (!template) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    const existing = await db('grades')
      .where({ 
        student_id: student_id, 
        schedule_id: schedule_id,
        date: dateOnly,
        quarter: quarter
      })
      .first();

    if (existing) {
      await db('grades')
        .where({ id: existing.id })
        .update({ 
          grade: grade,
          comment: comment || existing.comment,
          updated_at: new Date() 
        });
    } else {
      await db('grades').insert({
        student_id: student_id,
        subject_id: template.subject_id,
        schedule_id: schedule_id,
        date: dateOnly,
        quarter: quarter,
        grade: grade,
        comment: comment || null,
        exam: false,
        final: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json({ message: 'Оценка сохранена' });
  } catch (err) {
    console.error('Ошибка сохранения оценки:', err);
    res.status(500).json({ error: err.message });
  }
};

// Удалить оценку (доступно только учителю/директору)
exports.deleteGrade = async (req, res) => {
  const { student_id, schedule_id, date, quarter = 1 } = req.body;
  const dateOnly = dayjs(date).format('YYYY-MM-DD');
  try {
    const hasAccess = await checkTeacherAccess(req.userId, schedule_id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'У вас нет прав на удаление этой оценки' });
    }

    await db('grades')
      .where({ 
        student_id: student_id, 
        schedule_id: schedule_id,
        date: dateOnly,
        quarter: quarter
      })
      .del();
    res.json({ message: 'Оценка удалена' });
  } catch (err) {
    console.error('Ошибка удаления оценки:', err);
    res.status(500).json({ error: err.message });
  }
};