const router = require("express").Router();

const filesController = require("../controller/filesController");

router.get("/:filename", filesController.filename);
router.delete("/:filename", filesController.delete);

module.exports = router;
