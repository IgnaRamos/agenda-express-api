const express = require ('express');
const router = express.Router();
const {verifyToken, isScheduler} = require('../middleware/auth');
const schedulerCtrl = require('../controllers/schedules.controller');

router.use(verifyToken, isScheduler);

router.get('/patient/:rut/history', schedulerCtrl.getHistoryByRut);

router.get('/patient/:rut', schedulerCtrl.getSchedulesByRut);
router.post('/patient/:rut', schedulerCtrl.createSchedule);
router.put('/:id', schedulerCtrl.updateSchedule);
router.delete('/:id', schedulerCtrl.removeSchedule);

router.get('/receipt/patient/:rut', schedulerCtrl.getExamConfirmation);

module.exports = router;


