const router = require("express").Router();

const upload = require("../middleware/upload");
const stadiumsController = require("../controller/stadiumController");

// OWNER and ADMIN
router.post("/create", upload.single("file"), stadiumsController.create);
router.put("/:id", stadiumsController.update);
router.delete("/:id", stadiumsController.delete);

// OWNER, ADMIN and PLAYER
router.post("/all", stadiumsController.all);
router.get("/id/:id", stadiumsController.id);
router.get("/locations", stadiumsController.locations);

// PLAYER
router.put("/toggle_like/:id", stadiumsController.toggleLike);

module.exports = router;
