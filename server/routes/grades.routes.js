const db = require('../config/db');
const router = require('express').Router();
const controller = require('../controllers/grades.controller');
const auth = require('../middlewares/auth');

router.use(auth.verifyToken);

// Middleware для получения ролей пользователя
async function getUserRoles(req, res, next) {
  try {
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', req.userId)
      .pluck('roles.name');
    req.userRoles = roles;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Применяем middleware для всех маршрутов
router.use(getUserRoles);

// GET – доступно ученику, преподавателю и директору
router.get('/', (req, res, next) => {
  const { userRoles } = req;
  if (userRoles.includes('Ученик') || userRoles.includes('Преподаватель') || userRoles.includes('Директор')) {
    return next();
  }
  res.status(403).json({ message: 'Доступ запрещён' });
}, controller.getGrades);

// POST – только преподаватель или директор
router.post('/', (req, res, next) => {
  const { userRoles } = req;
  if (userRoles.includes('Преподаватель') || userRoles.includes('Директор')) {
    return next();
  }
  res.status(403).json({ message: 'Доступ запрещён. Требуется роль Преподаватель или Директор' });
}, controller.setGrade);

// DELETE – только преподаватель или директор
router.delete('/', (req, res, next) => {
  const { userRoles } = req;
  if (userRoles.includes('Преподаватель') || userRoles.includes('Директор')) {
    return next();
  }
  res.status(403).json({ message: 'Доступ запрещён. Требуется роль Преподаватель или Директор' });
}, controller.deleteGrade);

module.exports = router;