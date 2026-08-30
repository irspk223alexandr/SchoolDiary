const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.signup = async (req, res) => {
  const { login, last_name, first_name, middle_name, email, password, class: studentClass, ...rest } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const inserted = await db('users').insert({
      login,
      last_name,
      first_name,
      middle_name,
      email,
      password: hashed,
      class: studentClass || null,
      ...rest
    }).returning('id');
    const userId = inserted[0].id;
    await db('user_roles').insert({ user_id: userId, role_id: 1 });
    res.status(201).json({ message: 'Пользователь создан. Директор назначит роль.' });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    
    if (err.code === '23505') {
      if (err.constraint === 'users_email_unique') {
        return res.status(409).json({ 
          error: 'EMAIL_EXISTS',
          message: 'Этот email уже зарегистрирован. Пожалуйста, используйте другой email.' 
        });
      }
      if (err.constraint === 'users_login_unique') {
        return res.status(409).json({ 
          error: 'LOGIN_EXISTS',
          message: 'Этот логин уже занят. Пожалуйста, придумайте другой логин.' 
        });
      }
    }
    
    res.status(500).json({ error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await db('users').where({ login }).first();
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', user.id)
      .pluck('roles.name');

    res.json({ token, user: { ...user, roles } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить роли текущего пользователя
exports.getRoles = async (req, res) => {
  try {
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', req.userId)
      .pluck('roles.name');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};