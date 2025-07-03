const { getConnection } = require('../db');

//Función para manejar los errores en las solicitudes
const sendError = (res, err) =>
  res.status(500).json({ message: 'Error en la base de datos', error: err });

//Función para obtener pacientes por rut(admin)
const getByRut = async (req, res) => {
  try {
    const conn = getConnection();
    const [rows] = await conn.query('SELECT * FROM patients WHERE rut = ?', [req.params.rut]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no existe.'});
    }
    res.json(rows[0]);
  } catch (err) {
    sendError(res, err);
  }
}

// Función para crear paciente(admin)
const createPatient = async (req, res) => {
  const { first_name, last_name, dob, phone, email, rut } = req.body;
  if(!first_name, !last_name, !dob, !phone, !rut) return res.status(400).json({ message: 'Favor completar todos los campos solicitados'});

  try {
    const conn = getConnection();
    const [result] = await conn.query(
      'INSERT INTO patients (first_name, last_name, dob, phone, email, rut) VALUES (?,?,?,?,?,?)',
      [first_name, last_name, dob, phone, email || null, rut]
    );
    res.status(201).json ({ id: result.insertId, first_name, last_name, dob, phone, email, rut});
  } catch (err) {
    sendError(res, err);
  }
};

// Función para actualizar teléfono y/o email del paciente.(admin)
const updatePatient = async (req, res) => {
  const { phone, email } = req.body;
  try {
    const conn = getConnection();
    const updates = [];
    const values = [];

    if (phone !== undefined) { //Condiciones que nos permitiran poder actualizar campos de manera indepeniente (no es necesario actaulizar ambos)
      updates.push('phone = ?');
      values.push(phone);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
    }

    values.push(req.params.rut);

    const [result] = await conn.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE rut = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json({ message: 'Paciente actualizado.' });
  } catch (err) {
    sendError(res, err);
  }
};


// Función para eliminar paciente(admin)
const removePatient = async (req, res) => {
  try {
    const conn = getConnection();
    const [result] = await conn.query ('DELETE FROM patients WHERE rut = ?', [req.params.rut]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.'});
    }

    res.json({ message: 'Paciente eliminado'});
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {getByRut, createPatient, updatePatient, removePatient };
