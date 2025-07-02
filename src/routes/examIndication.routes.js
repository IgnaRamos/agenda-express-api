const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const examIndicationCtrl = require('../controllers/examIndication.controller');

router.use(verifyToken, isAdmin); 

router.post('/', examIndicationCtrl.addExamIndication);

module.exports = router;
