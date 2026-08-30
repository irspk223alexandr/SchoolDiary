const router = require('express').Router();
const controller = require('../controllers/director.controller');
const auth = require('../middlewares/auth');

// Все маршруты требуют авторизации
router.use(auth.verifyToken);

// Доступно для всех авторизованных
router.get('/students', controller.getAllStudents);
router.get('/classes', controller.getAllClasses); // ← перенесли сюда

// Остальные маршруты — только для директора
router.use(auth.isRole('Директор'));

router.post('/student', controller.createStudent);
router.get('/teachers', controller.getAllTeachers);
router.post('/teacher', controller.createTeacher);
router.delete('/student/:id', controller.deleteStudent);
router.post('/schedule', controller.addScheduleItem);

// Управление классами
router.put('/class/:id', controller.updateClass);
router.put('/students/bulk-class', controller.bulkUpdateStudentClass);
router.post('/promote-all', controller.promoteAllClasses);

// Детальный просмотр учителя
router.get('/teacher/:id', controller.getTeacherById);

router.get('/positions', controller.getPositions);
router.put('/teacher/:id/positions', controller.updateTeacherPositions);

module.exports = router;