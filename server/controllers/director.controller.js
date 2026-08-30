const db = require('../config/db');
const bcrypt = require('bcrypt');
const knex = require('../config/db');
const { generatePassword, generateLogin } = require('../services/generateCredentials');

// Получить всех учеников
// Получить всех учеников (доступно для всех авторизованных)
exports.getAllStudents = async (req, res) => {
  try {
    // Проверяем роль текущего пользователя
    const roles = await knex('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', req.userId)
      .pluck('roles.name');
    const isDirector = roles.includes('Директор');

    // Базовый запрос
    let query = knex('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('user_roles.role_id', 1) // только ученики
      .leftJoin('classes', 'users.class_id', 'classes.id')
      .orderBy('users.last_name', 'asc');

    // Выбираем поля в зависимости от роли
    if (isDirector) {
      query = query.select(
        'users.id',
        'users.login',
        'users.plain_password',
        'users.last_name',
        'users.first_name',
        'users.middle_name',
        'users.email',
        'users.class_id',
        'classes.grade as class_name'
      );
    } else {
      query = query.select(
        'users.id',
        'users.login',
        'users.last_name',
        'users.first_name',
        'users.middle_name',
        'users.email',
        'users.class_id',
        'classes.grade as class_name'
      );
    }

    const students = await query;

    // Добавляем среднюю оценку
    for (let s of students) {
      const avg = await knex('grades')
        .where('student_id', s.id)
        .avg('grade as avg')
        .first();
      s.average_grade = avg ? parseFloat(avg.avg).toFixed(2) : '—';
      if (!s.class_name) s.class_name = 'Не назначен';
    }

    res.json(students);
  } catch (err) {
    console.error('Ошибка получения учеников:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить всех учителей
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('user_roles.role_id', 2)
      .select('users.*');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Создать ученика с генерацией логина и пароля
// Создать ученика
exports.createStudent = async (req, res) => {
  const { last_name, first_name, middle_name, email, class_id, ...rest } = req.body;
  try {
    const login = await generateLogin(last_name, first_name, middle_name);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const inserted = await knex('users').insert({
      login,
      last_name,
      first_name,
      middle_name,
      email: email || `${login}@school.local`,
      password: hashedPassword,
      plain_password: plainPassword,
      class_id: class_id || null,
      ...rest
    }).returning('id');
    const userId = inserted[0].id;
    await knex('user_roles').insert({ user_id: userId, role_id: 1 });

    res.status(201).json({
      message: 'Ученик создан',
      login,
      password: plainPassword,
      userId
    });
  } catch (err) {
    console.error('Ошибка создания ученика:', err);
    
    if (err.code === '23505') {
      if (err.constraint === 'users_email_unique') {
        return res.status(409).json({ 
          error: 'EMAIL_EXISTS',
          message: 'Этот email уже используется. Пожалуйста, используйте другой email.' 
        });
      }
      if (err.constraint === 'users_login_unique') {
        return res.status(409).json({ 
          error: 'LOGIN_EXISTS',
          message: 'Этот логин уже занят. Пожалуйста, попробуйте снова.' 
        });
      }
    }
    
    res.status(500).json({ error: err.message });
  }
};

// Создать учителя с множественными должностями
exports.createTeacher = async (req, res) => {
  const { last_name, first_name, middle_name, email, position_ids, ...rest } = req.body;
  try {
    const login = await generateLogin(last_name, first_name, middle_name);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const inserted = await db('users').insert({
      login,
      last_name,
      first_name,
      middle_name,
      email: email || `${login}@school.local`,
      password: hashedPassword,
      plain_password: plainPassword,
      ...rest
    }).returning('id');
    const userId = inserted[0].id;
    await db('user_roles').insert({ user_id: userId, role_id: 2 });

    if (position_ids && position_ids.length > 0) {
      const positionRows = position_ids.map(position_id => ({
        user_id: userId,
        position_id: position_id
      }));
      await db('user_positions').insert(positionRows);
    }

    res.status(201).json({
      message: 'Учитель создан',
      login,
      password: plainPassword,
      userId
    });
  } catch (err) {
    console.error('Ошибка создания учителя:', err);
    if (err.code === '23505') {
      if (err.constraint === 'users_email_unique') {
        return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Этот email уже используется.' });
      }
      if (err.constraint === 'users_login_unique') {
        return res.status(409).json({ error: 'LOGIN_EXISTS', message: 'Этот логин уже занят.' });
      }
    }
    res.status(500).json({ error: err.message });
  }
};

// Удалить ученика
exports.deleteStudent = async (req, res) => {
  const id = req.params.id;
  try {
    await db('users').where({ id }).del();
    res.json({ message: 'Ученик удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Добавить расписание (заглушка)
exports.addScheduleItem = async (req, res) => {
  // пока просто возвращаем ответ
  res.json({ message: 'Расписание пока не реализовано' });
};

// Изменить роль пользователя
exports.changeUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role_name } = req.body;

  try {
    // Проверяем, существует ли роль
    const role = await db('roles').where({ name: role_name }).first();
    if (!role) {
      return res.status(404).json({ message: 'Роль не найдена' });
    }

    // Обновляем роль
    await db('user_roles')
      .where({ user_id: userId })
      .update({ role_id: role.id });

    res.json({ message: `Роль изменена на "${role_name}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить все классы
// server/controllers/director.controller.js

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await knex('classes')
      .select(
        'classes.*',
        knex.raw("CONCAT(users.last_name, ' ', users.first_name, ' ', users.middle_name) as teacher_full_name")
      )
      .leftJoin('users', 'classes.teacher_id', 'users.id')
      .orderBy('classes.grade', 'asc');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Создать класс
exports.createClass = async (req, res) => {
  const { grade, teacher_id, academic_year } = req.body;
  try {
    const inserted = await knex('classes').insert({
      grade,
      teacher_id: teacher_id || null,
      academic_year: academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    }).returning('id');
    res.status(201).json({ message: 'Класс создан', id: inserted[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Перевести учеников в следующий класс (конец года)
exports.promoteStudents = async (req, res) => {
  const { currentClassId } = req.body;
  try {
    const currentClass = await knex('classes').where({ id: currentClassId }).first();
    if (!currentClass) {
      return res.status(404).json({ message: 'Класс не найден' });
    }
    
    const nextGrade = currentClass.grade + 1;
    if (nextGrade > 9) {
      return res.status(400).json({ message: 'Это выпускной класс (9). Ученики переведены в старшую школу' });
    }
    
    const nextClass = await knex('classes')
      .where({ grade: nextGrade })
      .first();
    
    if (!nextClass) {
      const inserted = await knex('classes').insert({
        grade: nextGrade,
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      }).returning('id');
      
      await knex('users')
        .where({ class_id: currentClassId })
        .update({ class_id: inserted[0] });
      
      return res.json({ message: `Ученики переведены в ${nextGrade} класс` });
    } else {
      await knex('users')
        .where({ class_id: currentClassId })
        .update({ class_id: nextClass.id });
      
      return res.json({ message: `Ученики переведены в ${nextGrade} класс` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить информацию об учителе по ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Получаем информацию об учителе
    const teacher = await knex('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('user_roles.role_id', 2) // роль Преподаватель
      .where('users.id', teacherId)
      .select(
        'users.*',
        knex.raw("ARRAY_AGG(DISTINCT classes.grade) as taught_classes")
      )
      .leftJoin('classes', 'classes.teacher_id', 'users.id')
      .groupBy('users.id')
      .first();
    
    if (!teacher) {
      return res.status(404).json({ message: 'Учитель не найден' });
    }
    
    // Получаем предметы, которые ведёт учитель
    const subjects = await knex('schedule')
      .join('subjects', 'schedule.subject_id', 'subjects.id')
      .where('schedule.teacher_id', teacherId)
      .distinct('subjects.id', 'subjects.name')
      .select('subjects.id', 'subjects.name');
    
    teacher.subjects = subjects;
    
    res.json(teacher);
  } catch (err) {
    console.error('Ошибка получения учителя:', err);
    res.status(500).json({ error: err.message });
  }
};

// Изменить класс ученика
exports.changeStudentClass = async (req, res) => {
  const { studentId, classId } = req.body;
  
  try {
    // Проверяем, существует ли ученик
    const student = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('user_roles.role_id', 1)
      .where('users.id', studentId)
      .first();
    
    if (!student) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }
    
    // Проверяем, существует ли класс
    if (classId) {
      const classExists = await db('classes').where({ id: classId }).first();
      if (!classExists) {
        return res.status(404).json({ message: 'Класс не найден' });
      }
    }
    
    // Обновляем класс ученика
    await db('users')
      .where({ id: studentId })
      .update({ 
        class_id: classId || null,
        updated_at: new Date()
      });
    
    // Получаем обновлённого ученика с названием класса
    const updatedStudent = await db('users')
      .select(
        'users.*',
        'classes.grade as class_name'
      )
      .leftJoin('classes', 'users.class_id', 'classes.id')
      .where('users.id', studentId)
      .first();
    
    res.json({ 
      message: 'Класс ученика изменён', 
      student: updatedStudent 
    });
  } catch (err) {
    console.error('Ошибка изменения класса:', err);
    res.status(500).json({ error: err.message });
  }
};

// Обновить класс (назначить классного руководителя)
exports.updateClass = async (req, res) => {
  const classId = req.params.id;
  const { teacher_id } = req.body;
  try {
    await knex('classes')
      .where({ id: classId })
      .update({ teacher_id: teacher_id || null });
    res.json({ message: 'Класс обновлён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Массовое обновление class_id у учеников
exports.bulkUpdateStudentClass = async (req, res) => {
  const { class_id, student_ids } = req.body;
  try {
    if (student_ids && student_ids.length > 0) {
      await knex('users')
        .whereIn('id', student_ids)
        .update({ class_id: class_id || null });
    }
    res.json({ message: 'Ученики обновлены' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Перевести класс в следующий (вместе с классным руководителем)
exports.promoteClass = async (req, res) => {
  const { classId } = req.body;
  
  try {
    // Получаем текущий класс
    const currentClass = await knex('classes')
      .where({ id: classId })
      .first();
    
    if (!currentClass) {
      return res.status(404).json({ error: 'Класс не найден' });
    }
    
    const currentGrade = currentClass.grade;
    const nextGrade = currentGrade + 1;
    
    // Если это выпускной (9 класс) — ничего не делаем
    if (currentGrade >= 9) {
      return res.status(400).json({ error: 'Это выпускной класс (9). Перевод невозможен.' });
    }
    
    // Ищем или создаём следующий класс
    let nextClass = await knex('classes')
      .where({ grade: nextGrade })
      .first();
    
    if (!nextClass) {
      // Создаём следующий класс
      const [newClassId] = await knex('classes')
        .insert({
          grade: nextGrade,
          teacher_id: currentClass.teacher_id, // переносим классного руководителя
          academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        })
        .returning('id');
      
      nextClass = await knex('classes')
        .where({ id: newClassId })
        .first();
    } else {
      // Если следующий класс уже существует — обновляем его руководителя
      await knex('classes')
        .where({ id: nextClass.id })
        .update({
          teacher_id: currentClass.teacher_id,
          updated_at: new Date()
        });
    }
    
    // Переносим учеников в следующий класс
    await knex('users')
      .where({ class_id: classId })
      .update({ class_id: nextClass.id });
    
    // Если у текущего класса больше нет учеников, можно оставить как есть
    // или удалить, но лучше сохранить для истории
    
    res.json({ 
      message: `Класс ${currentGrade} успешно переведён в ${nextGrade} класс. Учитель перенесён.`,
      nextClassId: nextClass.id
    });
  } catch (err) {
    console.error('Ошибка перевода класса:', err);
    res.status(500).json({ error: err.message });
  }
};

// Перевести все классы в следующий, учеников 9-го удалить
// Перевести все классы в следующий, учеников 9-го удалить
exports.promoteAllClasses = async (req, res) => {
  try {
    const newAcademicYear = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

    // 1. Найти 9-й класс, удалить его учеников и очистить учителя
    const class9 = await knex('classes').where({ grade: 9 }).first();
    if (class9) {
      await knex('users').where({ class_id: class9.id }).del();
      await knex('classes').where({ id: class9.id }).update({ teacher_id: null });
    }

    // 2. Переводим классы с 8 по 1
    for (let grade = 8; grade >= 1; grade--) {
      const currentClass = await knex('classes').where({ grade }).first();
      if (!currentClass) continue;

      const nextGrade = grade + 1;
      let nextClass = await knex('classes').where({ grade: nextGrade }).first();

      if (!nextClass) {
        // Создаём следующий класс, копируем учителя
        const [newId] = await knex('classes')
          .insert({
            grade: nextGrade,
            teacher_id: currentClass.teacher_id,
            academic_year: newAcademicYear
          })
          .returning('id');
        nextClass = await knex('classes').where({ id: newId }).first();
      } else {
        // Обновляем учителя и год у следующего класса
        await knex('classes')
          .where({ id: nextClass.id })
          .update({
            teacher_id: currentClass.teacher_id,
            academic_year: newAcademicYear
          });
      }

      // Переносим учеников из текущего класса в следующий
      await knex('users')
        .where({ class_id: currentClass.id })
        .update({ class_id: nextClass.id });

      // Очищаем учителя у текущего класса (он становится пустым для нового набора)
      await knex('classes')
        .where({ id: currentClass.id })
        .update({ teacher_id: null, academic_year: newAcademicYear });
    }

    res.json({ message: 'Все классы успешно переведены. Ученики 9-го класса удалены.' });
  } catch (err) {
    console.error('Ошибка массового перевода:', err);
    res.status(500).json({ error: err.message });
  }
};

// Удалить учителя
exports.deleteTeacher = async (req, res) => {
  const id = req.params.id;
  try {
    // Проверяем, что пользователь действительно учитель
    const teacher = await knex('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('users.id', id)
      .where('user_roles.role_id', 2) // роль Преподаватель
      .first();
    if (!teacher) {
      return res.status(404).json({ message: 'Учитель не найден' });
    }
    // Удаляем пользователя (каскадно удалятся связи)
    await knex('users').where({ id }).del();
    res.json({ message: 'Учитель удалён' });
  } catch (err) {
    console.error('Ошибка удаления учителя:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить все должности
exports.getPositions = async (req, res) => {
  try {
    const positions = await db('positions').select('*').orderBy('name', 'asc');
    res.json(positions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Обновить должности учителя
// Обновить должности учителя или директора
exports.updateTeacherPositions = async (req, res) => {
  const teacherId = req.params.id;
  const { position_ids } = req.body; // массив id должностей
  try {
    // Проверяем, что пользователь учитель или директор
    const user = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .where('users.id', teacherId)
      .whereIn('user_roles.role_id', [2, 3]) // Преподаватель или Директор
      .first();
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    // Удаляем старые связи
    await db('user_positions').where('user_id', teacherId).del();
    // Добавляем новые
    if (position_ids && position_ids.length > 0) {
      const rows = position_ids.map(pid => ({ user_id: teacherId, position_id: pid }));
      await db('user_positions').insert(rows);
    }
    res.json({ message: 'Должности обновлены' });
  } catch (err) {
    console.error('Ошибка обновления должностей:', err);
    res.status(500).json({ error: err.message });
  }
};