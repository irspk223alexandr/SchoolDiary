const db = require('../config/db');

// Получить успеваемость ученика по всем предметам и четвертям
exports.getProgress = async (req, res) => {
  try {
    const userId = req.userId;

    // Проверяем, что пользователь — ученик
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .pluck('roles.name');

    const isStudent = roles.includes('Ученик');
    const isTeacher = roles.includes('Преподаватель');
    const isDirector = roles.includes('Директор');

    // Если учитель или директор — могут смотреть успеваемость любого ученика
    let studentId = userId;
    if (isTeacher || isDirector) {
      studentId = req.query.student_id || userId;
    }

    // Получаем все предметы
    const subjects = await db('subjects').select('*').orderBy('name', 'asc');

    // Получаем оценки ученика (с quarter, exam, final)
    const grades = await db('grades')
      .where('student_id', studentId)
      .select('subject_id', 'quarter', 'grade', 'exam', 'final');

    // Формируем результат
    const result = subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject_id === subject.id);

      // Оценки по четвертям (не экзамен и не итоговая)
      const q1 = subjectGrades.find(g => g.quarter === 1 && !g.exam && !g.final)?.grade || null;
      const q2 = subjectGrades.find(g => g.quarter === 2 && !g.exam && !g.final)?.grade || null;
      const q3 = subjectGrades.find(g => g.quarter === 3 && !g.exam && !g.final)?.grade || null;
      const q4 = subjectGrades.find(g => g.quarter === 4 && !g.exam && !g.final)?.grade || null;

      // Годовая (средняя по всем четвертям)
      const quarterGrades = [q1, q2, q3, q4].filter(g => g !== null);
      const yearGrade = quarterGrades.length > 0 
        ? Math.round(quarterGrades.reduce((a, b) => a + b, 0) / quarterGrades.length)
        : null;

      // Экзамен (exam = true)
      const exam = subjectGrades.find(g => g.exam && !g.final)?.grade || null;

      // Итоговая (final = true)
      const final = subjectGrades.find(g => g.final)?.grade || null;

      return {
        subject_id: subject.id,
        subject_name: subject.name,
        q1: q1,
        q2: q2,
        q3: q3,
        q4: q4,
        year_grade: yearGrade,
        exam_grade: exam,
        final_grade: final
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Ошибка получения успеваемости:', err);
    res.status(500).json({ error: err.message });
  }
};

// Поставить оценку (для учителя) — если нужно через эту страницу
exports.setGrade = async (req, res) => {
  const { student_id, subject_id, quarter, grade, exam, final, comment } = req.body;
  
  if (!student_id || !subject_id || !quarter || grade === undefined) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  if (grade < 1 || grade > 5) {
    return res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
  }

  try {
    const student = await db('users').where({ id: student_id }).first();
    if (!student) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    const subject = await db('subjects').where({ id: subject_id }).first();
    if (!subject) {
      return res.status(404).json({ message: 'Предмет не найден' });
    }

    const existing = await db('grades')
      .where({
        student_id,
        subject_id,
        quarter,
        exam: exam || false,
        final: final || false
      })
      .first();

    if (existing) {
      await db('grades')
        .where({ id: existing.id })
        .update({ grade, updated_at: new Date() });
    } else {
      await db('grades').insert({
        student_id,
        subject_id,
        quarter,
        grade,
        exam: exam || false,
        final: final || false,
        comment: comment || null,
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

// Получить список учеников (для учителя)
exports.getStudentsForTeacher = async (req, res) => {
  try {
    const teacherId = req.userId;

    const classes = await db('classes')
      .where('teacher_id', teacherId)
      .select('id', 'grade');

    const classIds = classes.map(c => c.id);

    if (classIds.length === 0) {
      return res.json([]);
    }

    const students = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('user_roles.role_id', 1)
      .whereIn('users.class_id', classIds)
      .select(
        'users.id',
        'users.last_name',
        'users.first_name',
        'users.middle_name',
        'users.class_id',
        'classes.grade'
      )
      .leftJoin('classes', 'users.class_id', 'classes.id')
      .orderBy('users.last_name', 'asc');

    res.json(students);
  } catch (err) {
    console.error('Ошибка получения учеников:', err);
    res.status(500).json({ error: err.message });
  }
};