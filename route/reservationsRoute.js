const router = require("express").Router();

const {
  reservationsController,
} = require("../controller/reservationsController");

// PLAYER
router.post("/create", reservationsController.create);
router.delete("/:id", reservationsController.delete);

//OWNER
router.put("/accept/:id", reservationsController.accept);
router.put("/decline/:id", reservationsController.decline);

// ADMIN, OWNER and PLAYER
router.post("/all", reservationsController.all);
router.get("/id/:id", reservationsController.id);
router.post("/available_hours", reservationsController.availableHours);

module.exports = router;
