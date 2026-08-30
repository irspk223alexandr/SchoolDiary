const router = require('express').Router();
const controller = require('../controllers/lessonTimes.controller');
const auth = require('../middlewares/auth');

// GET – доступен всем авторизованным (для отображения в расписании)
router.get('/', auth.verifyToken, controller.getAll);

// PUT – только директор
router.put('/', auth.verifyToken, auth.isRole('Директор'), controller.update);

module.exports = router;