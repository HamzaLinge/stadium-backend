const {
  reservationSocketController,
} = require("../controller/reservationsController");

function reservationSocket(socket, io) {
  socket.on("new_reservation", (data) =>
    reservationSocketController.new_reservation(socket, io, data)
  );
  socket.on("answer_reservation", (data) =>
    reservationSocketController.answer_reservation(socket, io, data)
  );
}

module.exports = reservationSocket;
