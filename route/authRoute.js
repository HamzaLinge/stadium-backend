const router = require("express").Router();

const authController = require("../controller/authController");

// ADMIN, OWNER and PLAYER
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/rememberMe", authController.rememberMe);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/confirmCode", authController.confirmCode);

module.exports = router;
