const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const UserModel = require("../model/UserModel");
const CodeModel = require("../model/CodeModel");

const generateToken = require("../utils/jwtHelper");
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcryptjs");

const authController = {
  login: async (req, res) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).send({
          success: false,
          msg: "Please enter your email and your password",
        });
      }
      const user = await UserModel.findOne({
        email: String(req.body.email).toLowerCase(),
      });
      if (!user) {
        return res.status(404).send({ success: false, msg: "User not found" });
      }
      if (!user.matchPassword(req.body.password)) {
        return res
          .status(403)
          .send({ success: false, msg: "Password incorrect" });
      }
      user["password"] = undefined;
      delete user.password;
      return res.status(200).send({
        success: true,
        data: { token: generateToken(user._id), user: user },
      });
    } catch (errorLogin) {
      return res
        .status(500)
        .send({ success: false, msg: "Something went wrong during logging" });
    }
  },
  register: async (req, res) => {
    console.log(req.body);
    try {
      if (
        !req.body.firstName ||
        !req.body.lastName ||
        !req.body.email ||
        !req.body.phoneNumber ||
        !req.body.password ||
        !req.body.birthday ||
        !req.body.role
      ) {
        return res
          .status(400)
          .send({ success: false, msg: "Please provide your all information" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res
          .status(400)
          .send({ success: false, msg: "Your email address is invalid" });
      }
      if (!/owner/i.test(req.body.role) && !/player/i.test(req.body.role)) {
        return res.status(400).send({
          success: false,
          msg: "Please, enter either a PLAYER or an OWNER as a role",
        });
      }
      const user = await UserModel.findOne({
        email: String(req.body.email).toLowerCase(),
      });
      if (user) {
        return res.status(403).send({
          success: false,
          msg: "This email is already associated with another user",
        });
      }
      const newUser = await UserModel.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: String(req.body.email).toLowerCase(),
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        birthday: req.body.birthday,
        role: req.body.role,
      });
      newUser["password"] = undefined;
      delete newUser.password;
      return res.status(200).send({
        success: true,
        data: { token: generateToken(newUser._id), user: newUser },
      });
    } catch (errorRegister) {
      console.log(errorRegister);
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during registering",
      });
    }
  },
  rememberMe: async (req, res) => {
    try {
      if (!req.body.token) {
        return res
          .status(400)
          .send({ success: false, msg: "There is no token provided" });
      }
      let userId;
      try {
        const { idUser } = jwt.verify(req.body.token, process.env.JWT_SECRET);
        userId = idUser;
      } catch (errorToken) {
        return res.status(403).send({
          success: false,
          msg: "Your token is invalid, you are not authorized",
        });
      }
      const user = await UserModel.findById(userId).select("-password");
      if (!user) {
        return res.status(404).send({
          success: false,
          msg: "There is no user associated with this token",
        });
      }
      return res.status(200).send({
        success: true,
        data: { token: generateToken(user._id), user: user },
      });
    } catch (errorAuthenticate) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during handling authenticating",
      });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      if (!req.body.email) {
        return res
          .status(400)
          .send({ success: false, msg: "Please enter your email address" });
      }
      const user = await UserModel.findOne({
        email: String(req.body.email).toLowerCase(),
      });
      if (!user) {
        return res.status(404).send({
          success: false,
          msg: "There is no user with that email address",
        });
      }
      let confirmationCode;
      try {
        confirmationCode = await sendMail(user.email);
      } catch (errorSendMail) {
        console.log(errorSendMail);
        return res.status(500).send({
          success: false,
          msg: "Something went wrong during sending mail to reset password",
        });
      }
      const newCode = await CodeModel.create({
        user: user._id,
        code: confirmationCode,
      });
      await UserModel.findOneAndUpdate(
        { _id: user._id },
        { code: newCode._id },
        { upsert: true }
      );
      return res.status(200).send({
        success: true,
        msg: "Please confirm your authentication with the code sent to your email account",
      });
    } catch (errorForgotPassword) {
      console.log(errorForgotPassword);
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during handling forgot password",
      });
    }
  },
  confirmCode: async (req, res) => {
    try {
      if (!req.body.email || !req.body.confirmationCode) {
        return res
          .status(400)
          .send({ success: false, msg: "Please enter your confirmation code" });
      }
      const user = await UserModel.findOne({
        email: String(req.body.email).toLowerCase(),
      }).populate({
        path: "code",
      });
      if (!user) {
        return res.status(404).send({
          success: false,
          msg: "There is no user found to confirm code",
        });
      }
      if (!user.code) {
        return res
          .status(403)
          .send({ success: false, msg: "There is no code found to confirm" });
      }
      if (user.code.consumed === true) {
        return res
          .status(403)
          .send({ success: false, msg: "This code is already consumed" });
      }
      if (user.code.expireAt - new Date().getTime() <= 0) {
        return res
          .status(403)
          .send({ success: false, msg: "This code is out of date" });
      }
      if (user.code.code !== parseInt(req.body.confirmationCode)) {
        return res
          .status(403)
          .send({ success: false, msg: "Your code is incorrect" });
      }
      await CodeModel.findOneAndUpdate(
        { _id: user.code._id },
        { consumed: true }
      );
      await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $unset: { code: 1 } }
      );
      return res
        .status(200)
        .send({ success: true, token: generateToken(user._id) });
    } catch (errorConfirmCode) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during confirm code",
      });
    }
  },
};

module.exports = authController;
