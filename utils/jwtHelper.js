const jwt = require("jsonwebtoken");

function generateToken(idUser) {
    return jwt.sign({ idUser }, process.env.JWT_SECRET, {
        expiresIn: 24 * 60 * 60
    });
}

module.exports = generateToken;
