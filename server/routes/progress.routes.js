const router = require('express').Router();
const controller = require('../controllers/progress.controller');
const auth = require('../middlewares/auth');

// Все маршруты требуют авторизации
router.use(auth.verifyToken);

// Получить успеваемость
router.get('/', controller.getProgress);

// Поставить оценку (только для учителя или директора)
router.post('/grade', auth.isRole('Преподаватель'), controller.setGrade);

// Получить учеников для учителя
router.get('/students', auth.isRole('Преподаватель'), controller.getStudentsForTeacher);


module.exports = router;