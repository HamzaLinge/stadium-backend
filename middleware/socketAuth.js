const jwt = require("jsonwebtoken");

const UserModel = require("../model/UserModel");

async function socketAuth(socket, next) {
  try {
    const { token } = socket.handshake.auth;
    if (!token) {
      socket.emit("no-access-token");
      return next();
    }
    let userId = undefined;
    try {
      const { idUser } = jwt.verify(token, process.env.JWT_SECRET);
      userId = idUser;
    } catch (errorAuthenticateSocket) {
      socket.emit("invalid-access-token");
      return next();
    }
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      socket.emit("no-user-found");
      return next();
    }
    socket.user = user;
    socket.join(user._id.toString());
    socket.emit("authenticated");
    return next();
  } catch (errorSocket) {
    socket.emit("error-socket")
    next();
  }
}

module.exports = socketAuth;
