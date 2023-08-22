const ReservationModel = require("../model/ReservationModel");
const StadiumModel = require("../model/StadiumModel");
const {
  subtractIntervals,
  checkIfThereIsIntersection,
  convertToMinutes,
} = require("../utils/interval");

const reservationsController = {
  all: async (req, res) => {
    try {
      let reservations = Array();
      if (req.user.role === "PLAYER") {
        reservations = await ReservationModel.find({
          player: req.user._id,
          status: req.body.status ? req.body.status : "HOLD",
        })
          .populate({
            path: "stadium",
            populate: [{ path: "owner" }, { path: "location" }],
          })
          .sort({ timestamp: -1 });
      } else if (req.user.role === "OWNER") {
        reservations = await ReservationModel.find({
          status: req.body.status ? req.body.status : "HOLD",
        })
          .populate({
            path: "stadium",
            match: { owner: req.user._id },
            populate: { path: "location" },
          })
          .populate({
            path: "player",
            select: "_id firstName lastName thumbnail",
          })
          .sort({ timestamp: -1 });
      } else {
        reservations = await ReservationModel.find({
          status: req.body.status ? req.body.status : "HOLD",
        })
          .populate({ path: "player" })
          .populate({
            path: "stadium",
            populate: [{ path: "owner" }, { path: "location" }],
          })
          .sort({ timestamp: -1 });
      }
      if (reservations.length === 0) {
        return res.status(404).send({
          success: false,
          msg: "There are no reservations found for you",
        });
      }
      return res.status(200).send({ success: true, data: reservations });
    } catch (errorGettingTheReservations) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting the reservations",
      });
    }
  },
  id: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).send({
          success: false,
          msg: "Please provide an id for a reservation",
        });
      }
      const reservation = await ReservationModel.findById(req.params.id)
        .populate({
          path: "stadium",
          populate: [{ path: "owner" }, { path: "location" }],
        })
        .populate({ path: "player" });
      if (!reservation) {
        return res
          .status(404)
          .send({ success: false, msg: "There is no reservation found" });
      }
      if (
        (req.user.role === "PLAYER" &&
          !reservation.player.equals(req.user._id)) ||
        (req.user.role === "OWNER" &&
          !reservation.stadium.owner._id.equals(req.user._id))
      ) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to access to this reservation",
        });
      }
      if (req.user.role === "ADMIN") {
        reservation.populate({ path: "player" }).populate({
          path: "stadium",
          populate: [{ path: "owner" }, { path: "location" }],
        });
      }
      return res.status(200).send({ success: true, data: reservation });
    } catch (errorGettingReservation) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting reservation",
      });
    }
  },
  create: async (req, res) => {
    try {
      if (["ADMIN", "OWNER"].includes(req.user.role)) {
        return res.status(401).send({
          success: false,
          msg: "You are not allowed to create a reservation",
        });
      }
      if (
        !req.body.team_name ||
        !req.body.date ||
        !req.body.from ||
        !req.body.to ||
        !req.body.stadium
      ) {
        return res.status(400).send({
          success: false,
          msg: "Please provide all the information about a reservation",
        });
      }
      const reservation = await ReservationModel.findOne({
        player: req.user._id,
        stadium: req.body.stadium,
        date: req.body.date,
      });
      if (reservation) {
        return res.status(403).send({
          success: false,
          msg: "You cannot reserve this stadium for this date more than once",
        });
      }
      if (
        !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.from) ||
        !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.to)
      ) {
        return res.status(400).send({
          success: false,
          msg: "The format of time is incorrect",
        });
      }
      const stadium = await StadiumModel.findById(req.body.stadium).select(
        "opening_hours"
      );
      if (
        convertToMinutes(req.body.from) <
          convertToMinutes(stadium.opening_hours.from) ||
        convertToMinutes(req.body.to) >
          convertToMinutes(stadium.opening_hours.to)
      ) {
        return res.status(403).send({
          success: false,
          msg: `You cannot reserve outside ${stadium.opening_hours.from} and ${stadium.opening_hours.to}`,
        });
      }
      const reservations = await ReservationModel.find({
        date: req.body.date,
      }).select("time");
      if (
        reservations.length > 0 &&
        !checkIfThereIsIntersection(
          { from: req.body.from, to: req.body.to },
          reservations.map((reservation) => reservation.time)
        )
      ) {
        return res.status(403).send({
          success: false,
          msg: "Please, specify a time within the available intervals",
        });
      }
      const newReservation = await ReservationModel.create({
        team_name: req.body.team_name,
        date: req.body.date,
        time: { from: req.body.from, to: req.body.to },
        player: req.user._id,
        stadium: req.body.stadium,
      });
      return res.status(200).send({ success: true, data: newReservation });
    } catch (errorCreatingNewReservation) {
      console.log(errorCreatingNewReservation);
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during creating new reservation",
      });
    }
  },
  accept: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).send({
          success: false,
          msg: "Please provide an id for a reservation",
        });
      }
      if (["ADMIN", "PLAYER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to accept a reservation",
        });
      }
      const reservation = await ReservationModel.findById(
        req.params.id
      ).populate({ path: "stadium", match: { owner: req.user._id } });
      if (!reservation) {
        res.status(404).send({
          success: false,
          msg: `No reservation was found to accept with id: ${req.params.id}`,
        });
      }
      if (reservation.status === "ACCEPTED") {
        return res.status(403).send({
          success: false,
          msg: "This reservation has already been accepted",
        });
      }
      if (reservation.status === "DECLINED") {
        return res.status(403).send({
          success: false,
          msg: "This reservation has already been declined",
        });
      }
      const acceptedReservation = await ReservationModel.findOneAndUpdate(
        { _id: req.params.id },
        { status: "ACCEPTED" },
        { new: true }
      );
      return res.status(200).send({ success: true, data: acceptedReservation });
    } catch (errorAcceptingReservation) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during accepting reservation",
      });
    }
  },
  decline: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).send({
          success: false,
          msg: "Please provide an id for a reservation",
        });
      }
      if (["ADMIN", "PLAYER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to decline a reservation",
        });
      }
      const reservation = await ReservationModel.findById(
        req.params.id
      ).populate({ path: "stadium", match: { owner: req.user._id } });
      if (!reservation) {
        res.status(404).send({
          success: false,
          msg: `No reservation was found to accept with id: ${req.params.id}`,
        });
      }
      if (reservation.status === "ACCEPTED") {
        return res.status(403).send({
          success: false,
          msg: "This reservation has already been accepted",
        });
      }
      if (reservation.status === "DECLINED") {
        return res.status(403).send({
          success: false,
          msg: "This reservation has already been declined",
        });
      }
      const declinedReservation = await ReservationModel.findOneAndUpdate(
        { _id: req.params.id },
        { status: "DECLINED" },
        { new: true }
      );
      return res.status(200).send({ success: true, data: declinedReservation });
    } catch (errorDecliningReservation) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during declining reservation",
      });
    }
  },
  delete: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).send({
          success: false,
          msg: "Please provide an id for a reservation",
        });
      }
      if (["ADMIN", "PLAYER"].includes(req.user.role)) {
        return res.status(403).send({
          success: false,
          msg: "You are not allowed to delete a reservation",
        });
      }
      const reservation = await ReservationModel.findById(req.params.id);
      if (!reservation) {
        res.status(404).send({
          success: false,
          msg: `No reservation was found to delete with id: ${req.params.id}`,
        });
      }
      await ReservationModel.findOneAndDelete({ _id: req.params.id });
      return res.status(200).send({ success: true });
    } catch (errorDeletingReservation) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during deleting reservation",
      });
    }
  },
  availableHours: async (req, res) => {
    try {
      if (!req.body.idStadium || !req.body.date) {
        return res.status(400).send({
          success: false,
          msg: "Please provide all the required information",
        });
      }
      const stadium = await StadiumModel.findById(req.body.idStadium).select(
        "opening_hours"
      );
      const reservations = await ReservationModel.find({
        stadium: req.body.idStadium,
        date: req.body.date,
      }).select("time");
      const intervalsToSubtract =
        reservations.length > 0 ? reservations.map((res) => res.time) : [];
      const availableHours = subtractIntervals(
        stadium.opening_hours,
        intervalsToSubtract
      );
      return res.status(200).send({ success: true, data: availableHours });
    } catch (errorDeletingReservation) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during deleting reservation",
      });
    }
  },
};

const reservationSocketController = {
  new_reservation: async (socket, io, { idReservation }) => {
    try {
      const reservation = await ReservationModel.findById(idReservation)
        .populate({ path: "stadium", populate: { path: "location" } })
        .populate({
          path: "player",
          select: "_id firstName lastName thumbnail",
        });
      io.to(reservation.stadium.owner.toString()).emit(
        "new_reservation",
        JSON.stringify({ newReservation: reservation })
      );
    } catch (errorHandlingReservationSocket) {
      console.log(
        "Something went wrong during handling socket event new reservation"
      );
    }
  },
  answer_reservation: async (socket, io, { idReservation }) => {
    try {
      const reservation = await ReservationModel.findById(
        idReservation
      ).populate({
        path: "stadium",
        populate: [{ path: "owner" }, { path: "location" }],
      });
      io.to(reservation.player.toString()).emit(
        "answer_reservation",
        JSON.stringify({ answerReservation: reservation })
      );
    } catch (errorHandlingReservationSocket) {
      console.log(
        "Something went wrong during handling socket event answer reservation"
      );
    }
  },
};

module.exports = { reservationsController, reservationSocketController };
