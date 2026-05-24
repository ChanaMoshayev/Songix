const express = require("express");
const authController = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/register-request-otp", authController.registerRequestOtp);
authRouter.post("/request-otp", authController.requestOtp);
authRouter.post("/forgot-password-request", authController.forgotPasswordRequest);
authRouter.post("/forgot-password-verify", authController.forgotPasswordVerify);
authRouter.post("/verify-otp", authController.verifyOtp);
authRouter.post("/session", authController.sessionLogin);
authRouter.post("/logout", authController.logout);

module.exports = authRouter;

