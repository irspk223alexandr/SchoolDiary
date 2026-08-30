const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');

router.post('/signup', controller.signup);
router.post('/signin', controller.signin);
router.get('/roles', auth.verifyToken, controller.getRoles);

module.exports = router;