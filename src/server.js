const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const examsRoutes = require('./routes/exams.routes');
const indicationsRoutes = require('./routes/indications.routes');
const usersRoutes = require('./routes/users.routes');
const scheduleRoutes = require('./routes/schedules.routes');
const patientsRoutes = require('./routes/patients.routes');
const examIndicationRoutes = require('./routes/examIndication.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('API Agenda Médica funcionando');
});


app.use('/api/auth', authRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/indications', indicationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/examIndication', examIndicationRoutes);


app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serviddor corriendo en puerto ${PORT}`);
});