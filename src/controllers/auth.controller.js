const { getConnection } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Faltan datos para iniciar sesión' });

  try {
    const conn = getConnection(); //  OBTIENE la conexión
    const [results] = await conn.query(
      `SELECT users.id, username, password_hash, roles.rol as role
       FROM users JOIN roles ON users.role_id = roles.id
       WHERE username = ?`,
      [username]
    );

    if (results.length === 0)
      return res.status(401).json({ message: 'Usuario no encontrado' });

    const user = results[0];
    const validarPass = bcrypt.compareSync(password, user.password_hash);
    if (!validarPass)
      return res.status(401).json({ message: 'Contraseña incorrecta.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error en la consulta', error: err.message });
  }
};

module.exports = { login };
