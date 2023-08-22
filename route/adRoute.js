const router = require("express").Router();

const adController = require("../controller/adController");

// ADMIN, OWNER and PLAYER
router.post("/open", adController.open);
router.post("/all", adController.all);
router.delete("/close/:id", adController.close);

module.exports = router;
