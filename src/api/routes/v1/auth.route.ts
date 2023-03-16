export { };
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/auth.controller');
const { login, register, forgotPassword } = require('../../validations/auth.validation');

const router = express.Router();

router.route('/register').post(validate(register), controller.register);

router.route('/login').post(validate(login), controller.login);

router.route('/forgot-password').post(validate(forgotPassword), controller.forgotPassword);
router.route('/verify-account/:token').post(controller.verifyAccount);

module.exports = router;
