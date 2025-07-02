const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const usersCtrl = require('../controllers/users.controller');

router.use(verifyToken, isAdmin);

router.get('/', usersCtrl.getAll);
router.get('/:id', usersCtrl.getById);
router.post('/', usersCtrl.create);
router.put('/:id', usersCtrl.update);
router.delete('/:id', usersCtrl.remove);

module.exports = router;