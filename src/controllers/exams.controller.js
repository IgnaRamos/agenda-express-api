const { getConnection } = require('../db');

const sendError = (res, err) =>
  res.status(500).json({ message: 'Error en la base de datos', error: err });

//Función que lista los examenes disponibles(admin)
const getAll = async (req, res) => {
  try {
    const conn = getConnection();
    const [rows] = await conn.query('SELECT * FROM exams');
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};


const getById = async (req, res) => {
  try {
    const conn = getConnection();
    const [rows] = await conn.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    sendError(res, err);
  }
};

const create = async (req, res) => {
  const { name, modality, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Nombre del examen es requerido' });

  try {
    const conn = getConnection();
    const [result] = await conn.query(
      'INSERT INTO exams (name, modality, description) VALUES (?, ?, ?)',
      [name, modality || null, description || null]
    );
    res.status(201).json({ id: result.insertId, name, modality, description });
  } catch (err) {
    sendError(res, err);
  }
};

const update = async (req, res) => {
  const { name, modality, description } = req.body;
  try {
    const conn = getConnection();
    const [result] = await conn.query(
      'UPDATE exams SET name = COALESCE(?, name), modality = ?, description = ? WHERE id = ?',
      [name, modality || null, description || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    res.json({ message: 'Examen actualizado' });
  } catch (err) {
    sendError(res, err);
  }
};

const remove = async (req, res) => {
  try {
    const conn = getConnection();
    const [result] = await conn.query('DELETE FROM exams WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    res.json({ message: 'Examen eliminado' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'No se puede eliminar examen: Prestación agendada' });
    }
    sendError(res, err);
  }
};

module.exports = { getAll, getById, create, update, remove };
