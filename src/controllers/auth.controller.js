const { getConnection } = require('../db');
const bcrypt = require('bcryptjs'); //Dependencia para hasheo de contraseñas
const jwt = require('jsonwebtoken'); //Dependencia para diferenciar roles a través de la generación de un token
require('dotenv').config();


//Función para autenticarse con nombre de usuario y password 
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Faltan datos para iniciar sesión' });

  try {
    const conn = getConnection(); //Autentica dependiendo del rol que tenga asignado el usuario, lo que ayudara a limitar el acceso a tareas definidas para ESE usuario.
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
      { expiresIn: '2h' } //Establece token dde autenticación tenga validez de 8 horas (posterior a ese tiempo se debe logear denuevo).
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error en la consulta', error: err.message }); //Mensaje de error definido durante el desarrollo
  }
};

module.exports = { login };
