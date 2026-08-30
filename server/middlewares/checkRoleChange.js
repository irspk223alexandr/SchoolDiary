const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    // Проверяем, пытается ли пользователь изменить свою роль
    const userId = req.params.id || req.body.user_id;
    const currentUserRole = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', req.userId)
      .pluck('roles.name')
      .first();

    // Если текущий пользователь - директор
    if (currentUserRole === 'Директор') {
      // Проверяем, пытается ли он изменить роль другого директора
      const targetUserRole = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', userId)
        .pluck('roles.name')
        .first();

      if (targetUserRole === 'Директор' && req.userId !== parseInt(userId)) {
        return res.status(403).json({ 
          message: 'Вы не можете изменить роль другого директора' 
        });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};