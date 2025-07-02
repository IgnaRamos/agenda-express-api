const { getConnection } = require('../db');

const sendError = (res, err) =>
    res.status(500).json({ message: 'Error en la base de datos', error: err});

const getAll = async (req, res) => {
    try {
      const conn = getConnection();
      const [rows] = await conn.query(`SELECT * FROM indications`);
      res.json(rows);  
    } catch (err) {
        sendError(res,err);
    }            
};

const getById = async (req, res) => {
    try {
      const conn = getConnection();
      const [rows] = await conn.query('SELECT * FROM indications WHERE id = ?', [req.params.id]);
      if (rows.length === 0 ) {
        return res.status(404).json({ message: 'Indicacioón no existe' });
      }
      res.json(rows[0]);  
    } catch (err) {
        sendError(res, err);
    }
};

const create = async (req, res) => {
    const { content } = req.body;
    try {
      const conn = getConnection();
      const [result] = await conn.query(
        'INSERT INTO indications (content) VALUES (?)',
        [content]
      );
      res.status(201).json({ id: result.insertId, content});  
    } catch (err) {
        sendError(res, err);
    }
};

const update = async (req, res) => {
    const { content } = req.body;
    try {
      const conn = getConnection();
      const [result] = await conn.query(
        'UPDATE indications SET content = ? WHERE id = ?',
        [ content, req.params.id]
      );

      if (result.affectedRows === 0 ) {
        return res.status(404).json({ message: 'Indicación no encontrada'});
      }

      res.json({ message: 'Indicación para examen actualizada' });
    } catch (err) {
        sendError(res, err);
    }
};

const remove = async (req, res) => {
    try {
        const conn = getConnection();
        const [result] = await conn.query('DELETE FROM indications WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Indicacion para examen no existe'});
        }

        res.json({ message: 'Indicación eliminada' });
    }   catch (err) {
        sendError(res, err);
    }
    
};

module.exports = { getAll, getById, create, update, remove};