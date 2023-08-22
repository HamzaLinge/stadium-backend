const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const StadiumModel = require("../model/StadiumModel");
const LocationModel = require("../model/LocationModel");

const stadiumsController = {
  all: async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === "OWNER") {
        filter = { owner: req.user._id };
      }
      const stadiums = await StadiumModel.find(filter).populate({
        path: "location",
      });
      let filteredStadiums = stadiums;
      if (req.body.idLocation) {
        filteredStadiums = stadiums.filter(
          (stadium) => stadium.location._id.equals(req.body.idLocation)
        );
      }
      if (filteredStadiums.length === 0) {
        return res.status(404).send({
          success: false,
          msg: `There are no stadiums found${
            req.body.idLocation ? " for this location" : ""
          }`,
        });
      }
      return res.status(200).send({ success: true, data: filteredStadiums });
    } catch (errorGettingAllStadiums) {
      console.log(errorGettingAllStadiums);
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting all stadiums",
      });
    }
  },
  id: async (req, res) => {
    try {
      if (!req.params.id) {
        return res
          .status(400)
          .send({ success: false, msg: "Please provide an id stadium" });
      }
      const stadium = await StadiumModel.findById(req.params.id).populate({
        path: "location",
      });
      if (!stadium) {
        return res.status(404).send({
          success: false,
          msg: `There is no stadium found for id: ${req.params.id}`,
        });
      }
      return res.status(200).send({ success: true, data: stadium });
    } catch (errorGettingStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting stadium",
      });
    }
  },
  create: async (req, res) => {
    try {
      if (
        !req.body.name ||
        !req.body.price ||
        !req.body.description ||
        !req.body.location ||
        !req.body.opening_hours ||
        !req.body.opening_days ||
        !req.file
      ) {
        return res.status(400).send({
          success: false,
          msg: "Please provide all the information about the stadium",
        });
      }
      const formData = new FormData();
      formData.append("name", "state variable of name");
      if (
        !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(
          JSON.parse(req.body.opening_hours).from
        ) ||
        !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(
          JSON.parse(req.body.opening_hours).to
        )
      ) {
        return res.status(400).send({
          success: false,
          msg: "The format of opening hours is incorrect",
        });
      }
      if (!["ADMIN", "OWNER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to create a stadium",
        });
      }
      const stadium = await StadiumModel.findOne({
        name: req.body.name,
        location: req.body.location,
      });
      if (stadium) {
        return res.status(403).send({
          success: false,
          msg: "It seems that there is already a stadium with this name at this location",
        });
      }
      const newStadium = await StadiumModel.create({
        name: req.body.name,
        owner: req.user._id,
        price: req.body.price,
        description: req.body.description,
        location: req.body.location,
        opening_hours: JSON.parse(req.body.opening_hours),
        opening_days: JSON.parse(req.body.opening_days),
        thumbnail: req.file.filename,
      });
      return res.status(200).send({ success: true, data: newStadium });
    } catch (errorCreatingNewStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during creating new stadium",
      });
    }
  },
  delete: async (req, res) => {
    try {
      if (!req.params.id) {
        return res
          .status(400)
          .send({ success: false, msg: "Please provide an id stadium" });
      }
      const stadium = await StadiumModel.findById(req.params.id).select(
        "owner"
      );
      if (!stadium) {
        return res.status(404).send({
          success: false,
          msg: "There is no stadium with this id to delete",
        });
      }
      if (
        req.user.role !== "ADMIN" &&
        (req.user.role !== "OWNER" || !stadium.owner.equals(req.user._id))
      ) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to delete this stadium",
        });
      }
      await StadiumModel.findOneAndDelete({ _id: req.params.id });
      return res.status(200).send({ success: true });
    } catch (errorDeletingStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during deleting stadium",
      });
    }
  },
  update: async (req, res) => {
    try {
      if (!req.params.id) {
        return res
          .status(400)
          .send({ success: false, msg: "Please provide an id stadium" });
      }
      if (!req.body.update) {
        return res.status(400).send({
          success: false,
          msg: "Please provide the update information for the stadium",
        });
      }
      const stadium = await StadiumModel.findById(req.params.id).select(
        "owner"
      );
      if (!stadium) {
        return res.status(404).send({
          success: false,
          msg: "There is no stadium with this id to update",
        });
      }
      if (
        req.user.role !== "ADMIN" &&
        (req.user.role !== "OWNER" || !stadium.owner.equals(req.user._id))
      ) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to update this stadium",
        });
      }
      const updatedStadium = await StadiumModel.findOneAndUpdate(
        { _id: req.params.id },
        { ...req.body.update },
        { new: true }
      ).populate({ path: "location" });
      return res.status(200).send({ success: true, data: updatedStadium });
    } catch (errorUpdatingStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during updating stadium",
      });
    }
  },
  locations: async (req, res) => {
    try {
      const locations = await LocationModel.find();
      if (!locations) {
        return res.status(404).send({
          success: false,
          msg: "There is no location found",
        });
      }
      return res.status(200).send({ success: true, data: locations });
    } catch (errorUpdatingStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting locations",
      });
    }
  },
  toggleLike: async (req, res) => {
    try {
      if (!req.params.id) {
        return res
          .status(400)
          .send({ success: false, msg: "Please, provide the id stadium" });
      }
      const stadium = await StadiumModel.findById(req.params.id).select(
        "likes"
      );
      if (!stadium) {
        return res.status(404).send({
          success: false,
          msg: `There is no stadium found with id: ${req.params.id}`,
        });
      }
      if (stadium.likes.includes(req.user._id)) {
        await StadiumModel.findOneAndUpdate(
          { _id: req.params.id },
          { $pull: { likes: req.user._id } }
        );
      } else {
        await StadiumModel.findOneAndUpdate(
          { _id: req.params.id },
          { $push: { likes: req.user._id } }
        );
      }
      return res.status(200).send({ success: true });
    } catch (errorUpdatingStadium) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during toggling like stadium",
      });
    }
  },
};

module.exports = stadiumsController;
