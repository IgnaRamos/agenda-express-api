const express = require('express');
const router = express.Router();
const patientsCtrl = require('../controllers/patients.controller');
const { verifyToken, isAdmin, isScheduler } = require('../middleware/auth');

router.use(verifyToken, isAdmin, isScheduler);

router.get('/:rut', patientsCtrl.getByRut);
router.post('/', patientsCtrl.createPatient);
router.put('/:rut', patientsCtrl.updatePatient);
router.delete('/:rut', patientsCtrl.removePatient);

module.exports = router;
