const { getConnection } = require('../db');
const bcrypt = require('bcryptjs');

// manejo de errores en la bd
const sendError = (res, err) =>
  res.status(500).json({ message: 'Error en la base de datos', error: err });

// obtener id del rol por nombre
const getRoleId = async (roleName) => {
  const conn = getConnection();
  const [rows] = await conn.query('SELECT id FROM roles WHERE rol = ?', [roleName]);
  if (rows.length === 0) throw new Error('Rol no existe');
  return rows[0].id;
};

const getAll = async (req, res) => {
  try {
    const conn = getConnection();
    const sql = `SELECT users.id, username, roles.rol AS role
                 FROM users JOIN roles ON users.role_id = roles.id`;
    const [rows] = await conn.query(sql);
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
};

const getById = async (req, res) => {
  try {
    const conn = getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    sendError(res, err);
  }
};

const create = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ message: 'Nombre de usuario, contraseña y rol son requeridos' });

    const roleId = await getRoleId(role);
    const hash = bcrypt.hashSync(password, 10);

    const conn = getConnection();
    const [result] = await conn.query(
      'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)',
      [username, hash, roleId]
    );

    res.status(201).json({ id: result.insertId, username, role });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Usuario ya existe' });
    } else {
      sendError(res, error);
    }
  }
};

const update = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username && !password && !role)
      return res.status(400).json({ message: 'Nada que actualizar' });

    const conn = getConnection();
    let fields = [];
    let values = [];

    if (role) {
      const roleId = await getRoleId(role);
      fields.push('role_id = ?');
      values.push(roleId);
    }
    if (username) {
      fields.push('username = ?');
      values.push(username);
    }
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      fields.push('password_hash = ?');
      values.push(hash);
    }

    values.push(req.params.id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await conn.query(sql, values);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    sendError(res, error);
  }
};

const remove = async (req, res) => {
  try {
    const conn = getConnection();
    const [result] = await conn.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { getAll, getById, create, update, remove };
