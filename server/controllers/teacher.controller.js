const db = require('../config/db');

// Поставить оценку ученику по предмету
exports.setGrade = async (req, res) => {
  const { student_id, subject_id, quarter, grade, exam, final } = req.body;
  try {
    await db('grades').insert({ student_id, subject_id, quarter, grade, exam, final });
    res.json({ message: 'Оценка поставлена' });
  } catch (err) {
    console.error('Ошибка setGrade:', err);
    res.status(500).json({ error: err.message });
  }
};

// Добавить заметку ученику
exports.addNote = async (req, res) => {
  const { student_id, date, content } = req.body;
  try {
    await db('notes').insert({ student_id, date, content });
    res.json({ message: 'Заметка добавлена' });
  } catch (err) {
    console.error('Ошибка addNote:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить список всех учителей и директоров (доступно для всех авторизованных)
exports.getAllTeachersPublic = async (req, res) => {
  try {
    const teachers = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .whereIn('user_roles.role_id', [2, 3])
      .select(
        'users.id',
        'users.last_name',
        'users.first_name',
        'users.middle_name',
        'users.avatar',
        'users.school_name'
      )
      .orderBy('users.last_name', 'asc');
    // Добавляем должности для каждого учителя
    for (let teacher of teachers) {
      const positions = await db('positions')
        .join('user_positions', 'positions.id', 'user_positions.position_id')
        .where('user_positions.user_id', teacher.id)
        .select('positions.name');
      teacher.positions = positions.map(p => p.name);
    }
    res.json(teachers);
  } catch (err) {
    console.error('Ошибка получения учителей:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить информацию об учителе или директоре по ID (доступно для всех авторизованных)
exports.getTeacherById = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const userId = req.userId;

    const teacher = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .whereIn('user_roles.role_id', [2, 3])
      .where('users.id', teacherId)
      .select(
        'users.id',
        'users.last_name',
        'users.first_name',
        'users.middle_name',
        'users.email',
        'users.avatar',
        'users.school_name',
        'users.school_address',
        'users.school_phone',
        'users.school_site',
        'users.phone'
      )
      .first();

    if (!teacher) {
      return res.status(404).json({ message: 'Учитель не найден' });
    }

    // ✅ Получаем должности
    const positions = await db('positions')
      .join('user_positions', 'positions.id', 'user_positions.position_id')
      .where('user_positions.user_id', teacherId)
      .select('positions.name');
    teacher.positions = positions.map(p => p.name);

    // Классы
    const classes = await db('classes')
      .where('teacher_id', teacherId)
      .select('grade');
    teacher.taught_classes = classes.map(c => c.grade);

    // Предметы
    const subjects = await db('schedule')
      .join('subjects', 'schedule.subject_id', 'subjects.id')
      .where('schedule.teacher_id', teacherId)
      .distinct('subjects.id', 'subjects.name')
      .select('subjects.id', 'subjects.name');
    teacher.subjects = subjects;

    // Роли текущего пользователя
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .pluck('roles.name');
    const isDirector = roles.includes('Директор');

    if (isDirector) {
      const user = await db('users')
        .where('id', teacherId)
        .select('login', 'plain_password')
        .first();
      teacher.login = user ? user.login : null;
      teacher.plain_password = user ? user.plain_password : null;
    }

    res.json(teacher);
  } catch (err) {
    console.error('Ошибка получения учителя:', err);
    res.status(500).json({ error: err.message });
  }
};