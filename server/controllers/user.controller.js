const db = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    const currentUserId = req.userId;

    const user = await db('users')
      .select('users.*', 'classes.grade as class_name')
      .leftJoin('classes', 'users.class_id', 'classes.id')
      .where('users.id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Роли и должности
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .pluck('roles.name');
    user.roles = roles;

    if (roles.includes('Преподаватель') || roles.includes('Директор')) {
      const positions = await db('positions')
        .join('user_positions', 'positions.id', 'user_positions.position_id')
        .where('user_positions.user_id', userId)
        .select('positions.name');
      user.positions = positions.map(p => p.name);
    }

    if (roles.includes('Преподаватель')) {
      const taughtClasses = await db('classes')
        .where('teacher_id', userId)
        .select('grade')
        .orderBy('grade', 'asc');
      user.taught_classes = taughtClasses.map(c => c.grade);
    }

    // Если чужой профиль и не директор – убираем sensitive
    if (parseInt(userId) !== currentUserId) {
      const currentRoles = await db('roles')
        .join('user_roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', currentUserId)
        .pluck('roles.name');
      const isDirector = currentRoles.includes('Директор');
      if (!isDirector) {
        delete user.password;
        delete user.plain_password;
      } else {
        delete user.password; // хеш не показываем
        // plain_password оставляем для директора
      }
    } else {
      delete user.password;
    }

    res.json(user);
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  let userId = req.userId;
  // Если передан targetUserId и текущий пользователь директор – обновляем его
  if (req.body.targetUserId && req.body.targetUserId !== req.userId) {
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', req.userId)
      .pluck('roles.name');
    if (!roles.includes('Директор')) {
      return res.status(403).json({ error: 'Нет прав на редактирование чужого профиля' });
    }
    userId = req.body.targetUserId;
  }

  const allowedFields = [
    'last_name', 'first_name', 'middle_name', 'email',
    'school_name', 'school_address', 'school_phone', 'school_site',
    'home_address', 'home_phone', 'insurance_policy', 'blood_type',
    'medical_contraindications', 'parent_full_name', 'parent_phone',
    'phone'
  ];
  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Валидация длины
      if (field === 'phone' && req.body[field].length > 20) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Телефон не должен превышать 20 символов' });
      }
      if (['last_name','first_name','middle_name'].includes(field) && req.body[field].length > 100) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Длина ФИО не должна превышать 100 символов' });
      }
      updateData[field] = req.body[field];
    }
  }

  if (req.file) {
    updateData.avatar = req.file.filename;
  }

  try {
    await db('users').where({ id: userId }).update(updateData);
    const updated = await db('users').where({ id: userId }).first();
    res.json({ message: 'Профиль обновлён', user: updated });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    if (err.code === '23505' && err.constraint === 'users_email_unique') {
      return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Этот email уже используется.' });
    }
    res.status(500).json({ error: err.message });
  }
};