const router = require("express").Router();

const usersController = require("../controller/usersController");
const upload = require("../middleware/upload");

// PLAYER, ADMIN and OWNER
router.get("/me", usersController.me);
router.put("/resetPassword", usersController.resetPassword);
router.put("/update", usersController.update);
router.put("/picture", upload.single("file"), usersController.picture);
router.delete("/:id", usersController.delete);

// ADMIN
router.get("/all", usersController.all);
router.get("/id/:userId", usersController.id);

module.exports = router;
