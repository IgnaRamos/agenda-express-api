const { getConnection } = require('../db');


//Función que nos permite poder enlazar una misma indicación a un a muchos examenes
const addExamIndication = async (req, res) => {
  const { exam_id, indication_id } = req.body;

  if (!exam_id || !indication_id) {
    return res.status(400).json({ message: 'Faltan exam_id o indication_id' });
  }

  try {
    const conn = getConnection();
    await conn.query(
      'INSERT INTO exam_indications (exam_id, indication_id) VALUES (?, ?)',
      [exam_id, indication_id]
    );
    res.status(201).json({ message: 'Indicación se enlazó a examen' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'La relación ya existe' });
    }
    res.status(500).json({ message: 'Error al insertar', error: err });
  }
};

module.exports = { addExamIndication };
