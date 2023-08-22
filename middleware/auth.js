const jwt = require("jsonwebtoken");

const UserModel = require("../model/UserModel");

const protect = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({
          success: false,
          msg: "There is no token provided for authentication",
        });
    }
    const token = req.headers.authorization.split(" ")[1];
    const { idUser } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(idUser).select("-password");
    if (!user) {
      return res.status(404).send({
        success: false,
        msg: "No user was found during the authentication",
      });
    }
    req.user = user;
    next();
  } catch (errorAuth) {
    console.log(errorAuth);
    return res.status(401).send({ success: false, msg: "Unauthorized" });
  }
};

module.exports = protect;
