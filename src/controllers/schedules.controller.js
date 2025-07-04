const { getConnection } = require('../db');

const sendError = (res, err) =>
  res.status(500).json({ message: 'Error en la base de datos', error: err });


//Fúncion que permite acceder al historial del paciente en base a su rut y ver todos los cambios de citas y motivos.
const getHistoryByRut = async (req, res) => {
  const { rut } = req.params;
  try {
    const conn = getConnection();
    const [rows] = await conn.query(`
      SELECT sh.id, sh.changed, sh.old_status, sh.new_status, sh.notes,
             s.id AS schedule_id, s.date,
             e.name AS exam_name 
      FROM schedule_history sh
        JOIN schedules s ON sh.schedule_id = s.id
        JOIN exams     e ON s.exam_id      = e.id
        JOIN patients  p ON s.patient_id   = p.id
      WHERE p.rut = ?
      ORDER BY sh.changed DESC
    `, [rut]);
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};

//Función que nos permite acceder a las citas del paciente.
const getSchedulesByRut = async (req, res) => {
  const { rut } = req.params;
  try {
    const conn = getConnection();
    const [rows] = await conn.query(`
      SELECT s.*, e.name AS exam_name
      FROM schedules s
        JOIN exams e ON s.exam_id = e.id
        JOIN patients p ON s.patient_id = p.id
      WHERE p.rut = ?
      ORDER BY s.date DESC
      LIMIT 1;
    `, [rut]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paciente sin historial' });
    }

    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};

//Función que nos permite agendar examenes para los pacientes
const createSchedule = async (req, res) => {
  const { rut } = req.params;
  const { exam_id, date } = req.body;

  if (!exam_id || !date) {
    return res.status(400).json({ message: 'Examen y fecha son obligatorios' });
  }

  try {
    const conn = getConnection();

    // Buscar paciente por rut
    const [patients] = await conn.query('SELECT id FROM patients WHERE rut = ?', [rut]);
    if (patients.length === 0) return res.status(404).json({ message: 'Paciente no encontrado' });

    const patientId = patients[0].id;

    //Buscamos la indicación relacionada al examen
    const [[indication]] = await conn.query(
      'SELECT indication_id FROM exam_indications WHERE exam_id = ?',
      [exam_id]
    );

    const indicationId = indication ? indication.indication_id : null;

    // Insertar cita con la indicación que está enlazada al exam_id
    const [result] = await conn.query(
      `INSERT INTO schedules (patient_id, exam_id, indication_id, date, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, exam_id, date, req.user.id]
    );

    res.status(201).json({ message: 'Cita creada', id: result.insertId });

  } catch (err) {
    sendError(res, err);
  }
};

//Función que nos permite actualizar las citas de los pacientes y registrar en el historial
const updateSchedule = async (req, res) => {
  const { id } = req.params;
  // Extraemos indication_id con let para permitir reasignarlo
  const { exam_id, date, status} = req.body;
  let { indication_id } = req.body;

  try {
    const conn = getConnection();

    // Obtener datos antiguos para comparar
    const [[oldData]] = await conn.query('SELECT status, exam_id, indication_id FROM schedules WHERE id = ?', [id]);
    if (!oldData) return res.status(404).json({ message: 'Cita no encontrada' });

    const oldStatus = oldData.status;

    // Si no recibimos indication_id, pero si exam_id diferente, buscar la indicación correcta
    if ((!indication_id || indication_id === null) && exam_id && exam_id !== oldData.exam_id) {
      const [[indication]] = await conn.query('SELECT indication_id FROM exam_indications WHERE exam_id = ?', [exam_id]);
      indication_id = indication?.indication_id || null;
    }

    if (indication_id === undefined) {
      indication_id = oldData.indication_id;
    }

    // Actualizar con COALESCE para conservar valores no actualizados
    await conn.query(`
      UPDATE schedules 
      SET exam_id = COALESCE(?, exam_id),
          indication_id = ?,
          date = COALESCE(?, date),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [exam_id, indication_id, date, status, id]);

    // Obtener datos actualizados y devuelve respuesta
    const [[updated]] = await conn.query(`
      SELECT s.id,
             DATE_FORMAT(s.date, '%Y-%m-%d %H:%i') AS date,
             s.status,
             e.name AS exam_name,
             COALESCE(i.content, 'Sin indicaciones') AS indication
      FROM schedules s
      JOIN exams e ON e.id = s.exam_id
      LEFT JOIN indications i ON i.id = s.indication_id
      WHERE s.id = ?
    `, [id]);

   
    res.json({ message: 'Cita actualizada', updated });

  } catch (err) {
    sendError(res, err);
  }
};

//Función para cancelar citas
const removeSchedule = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const conn = getConnection();
    const [[row]] = await conn.query('SELECT status FROM schedules WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ message: 'Cita no encontrada' });

    const oldStatus = row.status;
    const newStatus = 'cancelled';

    await conn.query('UPDATE schedules SET status = ? WHERE id = ?', [newStatus, id]);

    await conn.query(
      `INSERT INTO schedule_history (schedule_id, change_by, old_status, new_status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.user.id, oldStatus, newStatus, notes]
    );

    res.json({ message: 'Cita cancelada correctamente' });
  } catch (err) {
    sendError(res, err);
  }
};

//Función que nos entregara el comprobante con todos los datos del paciente, la escripcion del examen y su indicación.
const getExamConfirmation = async (req, res) => {
  const { rut } = req.params;

  try {
    const conn = getConnection();
    const [rows] = await conn.query(`
      SELECT
        p.id           AS patient_id,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.dob, p.phone, p.email, p.rut,
        s.id           AS schedule_id,
        s.date         AS scheduled_date,
        s.status,
        e.name         AS exam_name,
        e.description      AS exam_description,
        e.modality,
        ind.content    AS indication
      FROM patients p
        JOIN schedules s   ON s.patient_id   = p.id
        JOIN exams e       ON s.exam_id      = e.id
        LEFT JOIN indications ind ON s.indication_id = ind.id
      WHERE p.rut = ? AND s.status = 'pending'
      ORDER BY s.date DESC
    `, [rut]);

    if (rows.length === 0)
      return res.status(404).json({ message: 'No hay examenes agendados pendientes de realizar'})

    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {getHistoryByRut, getSchedulesByRut, createSchedule, updateSchedule, removeSchedule, getExamConfirmation };
