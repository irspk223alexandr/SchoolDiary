const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

const isRole = (roleName) => async (req, res, next) => {
  try {
    const userRole = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', req.userId)
      .where('roles.name', roleName)
      .first();
    
    if (userRole) {
      next();
    } else {
      res.status(403).json({ message: `Доступ запрещён. Требуется роль "${roleName}"` });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const authJwt = {
  verifyToken,
  isRole
};

module.exports = authJwt;