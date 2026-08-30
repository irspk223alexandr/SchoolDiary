const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authJwt = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/profile', authJwt.verifyToken, controller.getProfile);
router.get('/profile/:id', authJwt.verifyToken, controller.getProfile); // ← этот должен быть
router.put('/profile', authJwt.verifyToken, upload, controller.updateProfile);

module.exports = router;