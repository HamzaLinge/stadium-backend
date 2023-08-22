const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./config/database");

const authRoute = require("./route/authRoute");
const usersRoute = require("./route/usersRoute");
const stadiumsRoute = require("./route/stadiumsRoute");
const reservationsRoute = require("./route/reservationsRoute");
const filesRoute = require("./route/filesRoute");
const adRoute = require("./route/adRoute");

const reservationSocket = require("./socket/reservationSocket");

const protectRoute = require("./middleware/auth");

const addTunisianCities = require("./config/addTunisianCities");
const socketAuth = require("./middleware/socketAuth");

async function mountServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      METHOD: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // MIDDLEWARE and POLICIES
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // app.use(cors({origin: "*"}));
  app.use(
    cors({
      origin: "http://localhost:3000",
      methods: ["GET", "PUT", "POST", "DELETE"],
    })
  );

  // DATABASE
  await connectDB();

  /* **** IMPORTANT ****
   *** If you want to add all the tunisian cities into the database,
   * uncomment the following line,
   * then comment it again to avoid to overwriting the entered data
   */
  // await addTunisianCities();

  // ROUTES
  app.get("/", (req, res) => res.send("Welcome Manar and Oumayma!"));
  app.use("/auth", authRoute);
  app.use("/users", protectRoute, usersRoute);
  app.use("/stadiums", protectRoute, stadiumsRoute);
  app.use("/reservations", protectRoute, reservationsRoute);
  app.use("/files", protectRoute, filesRoute);
  app.use("/ads", protectRoute, adRoute);

  // SOCKETS
  io.use(socketAuth);

  io.on("connection", (socket) => {
    if (!socket.user) return;
    socket.on("disconnect", () => {
      console.log(
        `User:${socket.user.email} is disconnected: ${socket.user.email} from socket server`
      );
    });
    reservationSocket(socket, io);
    console.log(`User: ${socket.user.email} is connected with socket server`);
  });

  // LISTENING
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

mountServer().catch((error) => console.log(error));
