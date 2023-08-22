const AdModel = require("../model/AdModel");
const ReservationModel = require("../model/ReservationModel");

const adController = {
  open: async (req, res) => {
    try {
      if (["ADMIN", "OWNER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to open an announcement",
        });
      }
      if (
        !req.body.team_number ||
        !req.body.team_phone ||
        !req.body.idReservation
      ) {
        return res.status(400).send({
          success: false,
          msg: "Please, provide all the necessary information",
        });
      }
      const reservation = await ReservationModel.findById(
        req.body.idReservation
      );
      if (!reservation) {
        return res.status(404).send({
          success: false,
          msg: "There is no reservation found to make an announcement",
        });
      }
      if (!reservation.player.equals(req.user._id)) {
        return res.status(200).send({
          success: false,
          msg: "You are not the creator of this reservation, you cannot make an announcement",
        });
      }
      if (reservation.status === "HOLD") {
        return res.status(403).send({
          success: false,
          msg: "This reservation is still in hold, you cannot make an announcement yet",
        });
      }
      if (reservation.status === "DECLINED") {
        return res.status(403).send({
          success: false,
          msg: "This reservation is declined, you cannot make an announcement",
        });
      }
      const announcement = await AdModel.create({
        reservation: req.body.idReservation,
        team_number: req.body.team_number,
        team_phone: req.body.team_phone,
      });
      return res.status(200).send({ success: true, data: announcement });
    } catch (errorCreatingAnnouncement) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during opening an announcement",
      });
    }
  },
  all: async (req, res) => {
    try {
      if (["ADMIN", "OWNER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to getting announcements",
        });
      }

      const ads = await AdModel.find({ status: true }).populate({
        path: "reservation",
        match: {
          player: req.body.onlyMe
            ? { $eq: req.user._id }
            : { $ne: req.user._id },
        },
      });
      const filteredAds = ads.filter((ad) => ad.reservation !== null);
      if (filteredAds.length === 0) {
        return res.status(404).send({
          success: false,
          msg: "There are no announcements published",
        });
      }
      return res.send({ success: true, data: filteredAds });
    } catch (errorGettingTheAnnouncements) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting the announcements",
      });
    }
  },
  close: async (req, res) => {
    try {
      if (["ADMIN", "OWNER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to close an announcement",
        });
      }
      if (!req.params.id) {
        return res.status(400).send({
          success: false,
          msg: "Please, provide the id of the announcement",
        });
      }
      const ad = await AdModel.findById(req.params.id).populate({
        path: "reservation",
      });
      if (!ad) {
        return res.status(404).send({
          success: false,
          msg: `There is no announcement found with id:${req.params.id}, to close`,
        });
      }
      if (!ad.reservation.player.equals(req.user._id)) {
        return res.status(403).send({
          success: false,
          msg: "This announcement does not belong to you, you cannot close it",
        });
      }
      if (!ad.status) {
        return res
          .status(403)
          .send({ success: false, msg: "This announcement is already closed" });
      }
      await AdModel.findOneAndUpdate({ _id: req.params.id }, { status: false });
      return res.status(200).send({ success: true });
    } catch (errorGettingTheAnnouncements) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during closing an announcement",
      });
    }
  },
};

module.exports = adController;
