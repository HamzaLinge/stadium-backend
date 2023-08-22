const bcrypt = require("bcryptjs");

const UserModel = require("../model/UserModel");

const generateToken = require("../utils/jwtHelper");

const usersController = {
  all: async (req, res) => {
    try {
      const users = await UserModel.find().select("-password");
      if (users.length === 0) {
        return res.status(404).send({ success: false, msg: "No users found" });
      }
      return res.status(200).send({ success: true, data: users });
    } catch (errorGettingAllUsers) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting all users",
      });
    }
  },
  id: async (req, res) => {
    try {
      if (!req.params.userId) {
        return res
          .status(401)
          .send({ success: false, mag: "There is no id user provided" });
      }
      if (req.user._id.equals(req.params.userId)) {
        return res.status(200).send({ success: true, data: req.user });
      }
      const user = await UserModel.findById(req.params.userId).select(
        "-password"
      );
      return res.status(200).send({ success: true, data: user });
    } catch (errorGettingMe) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting the user information",
      });
    }
  },
  me: async (req, res) => {
    try {
      return res.status(200).send({ success: true, data: req.user });
    } catch (errorGettingMe) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting your information",
      });
    }
  },
  resetPassword: async (req, res) => {
    try {
      if (!req.body.newPassword) {
        return res
          .status(401)
          .send({ success: false, msg: "Please enter your new password" });
      }
      const user = await UserModel.findOneAndUpdate(
        { _id: req.user._id },
        { password: bcrypt.hashSync(req.body.newPassword, 12) },
        { new: true }
      ).select("-password");
      return res.status(200).send({
        success: true,
        data: { token: generateToken(req.user._id), user: user },
      });
    } catch (errorResetPassword) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during reset password",
      });
    }
  },
  delete: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(401).send({
          success: false,
          msg: "There is no id provided to process delete",
        });
      }
      if (!req.user._id.equals(req.params.id) && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .send({ success: false, msg: "You are not allowed to delete" });
      }
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return res.status(404).send({
          success: false,
          msg: "There is no user found with the id provided",
        });
      }
      await UserModel.findOneAndDelete({ _id: req.params.id });
      return res.status(200).send({
        success: true,
        msg: `User with email: "${user.email}" was successfully deleted`,
      });
    } catch (errorDeletingUser) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during deleting user",
      });
    }
  },
  update: async (req, res) => {
    console.log(req.body);
    try {
      if (
        !req.body.firstName ||
        !req.body.lastName ||
        !req.body.email ||
        !req.body.phoneNumber ||
        !req.body.password ||
        !req.body.birthday
      ) {
        return res.status(400).send({
          success: false,
          msg: "Some information are missing",
        });
      }
      const user = await UserModel.findOne({ email: req.body.email });
      if (user) {
        if (req.user.email !== user.email) {
          res.status(403).send({
            success: false,
            msg: "There is already an user registered with this email address",
          });
        }
      }
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: req.user._id },
        { ...req.body, password: bcrypt.hashSync(req.body.password, 12) },
        { new: true }
      ).select("-password");
      return res.status(200).send({ success: true, user: updatedUser });
    } catch (errorUpdatingUser) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during updating user",
      });
    }
  },
  picture: async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .send({ success: false, msg: "Please provide a picture" });
      }
      await UserModel.findOneAndUpdate(
        { _id: req.user._id },
        { picture: req.file.filename }
      );
      return res.status(200).send({ success: true });
    } catch (error) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during updating user",
      });
    }
  },
};

module.exports = usersController;
