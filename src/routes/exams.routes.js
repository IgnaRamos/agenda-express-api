const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin} = require('../middleware/auth');
const examsCtrl = require('../controllers/exams.controller');

router.use(verifyToken, isAdmin);

router.get('/', examsCtrl.getAll);
router.get('/:id', examsCtrl.getById);
router.post('/', examsCtrl.create);
router.put('/:id', examsCtrl.update);
router.delete('/:id', examsCtrl.remove);

module.exports = router;