const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const indicationCtrl = require('../controllers/indications.controller');

router.use(verifyToken, isAdmin);

router.get('/',  indicationCtrl.getAll);
router.post('/', indicationCtrl.create);
router.put('/:id', indicationCtrl.update);
router.delete('/:id', indicationCtrl.remove);

module.exports = router;