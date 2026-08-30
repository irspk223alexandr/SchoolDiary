const router = require('express').Router();
const controller = require('../controllers/schedule.controller');
const auth = require('../middlewares/auth');

// Все маршруты требуют авторизации
router.use(auth.verifyToken);

// Получить расписание для недели
router.get('/', controller.getSchedule);

// Получить шаблон расписания (для админки)
router.get('/template', auth.isRole('Директор'), controller.getScheduleTemplate);
router.post('/template', auth.isRole('Директор'), controller.saveScheduleTemplate);
router.post('/template/item', auth.isRole('Директор'), controller.addTemplateItem);
router.delete('/template/item/:id', auth.isRole('Директор'), controller.deleteTemplateItem);
router.put('/template/item/:id/homework', auth.verifyToken, controller.saveHomework);
router.delete('/template/item/:id/homework', auth.verifyToken, controller.deleteHomework);
// Получить предметы
router.get('/subjects', controller.getSubjects);

module.exports = router;