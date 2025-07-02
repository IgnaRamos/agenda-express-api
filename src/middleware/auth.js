const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if(!token) return res.status(401).json({ message: 'Token no proporcionado'});

    const tokenActual = token.startsWith('Bearer') ? token.slice(7, token.length) : token;

    jwt.verify(tokenActual, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token inválido'});
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin'){
        return res.status(403).json({ message: 'Requiere rol de Administrador'});
    }
    next();
};

const isScheduler = (req, res, next) => {
    if (req.user.role !== 'scheduler') {
        return res.status(403).json({ message: 'Requiere rol de agenda'});
    }
    next();
};

module.exports = {verifyToken, isAdmin, isScheduler};