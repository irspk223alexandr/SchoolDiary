const router = require('express').Router();
const controller = require('../controllers/teacher.controller');
const auth = require('../middlewares/auth');

// Публичный маршрут для всех авторизованных пользователей
router.get('/', auth.verifyToken, controller.getAllTeachersPublic);

// Публичный маршрут для получения деталей учителя
router.get('/:id', auth.verifyToken, controller.getTeacherById);

// Маршруты для учителя (с проверкой роли)
router.post('/grade', auth.verifyToken, auth.isRole('Преподаватель'), controller.setGrade);
router.post('/note', auth.verifyToken, auth.isRole('Преподаватель'), controller.addNote);

module.exports = router;