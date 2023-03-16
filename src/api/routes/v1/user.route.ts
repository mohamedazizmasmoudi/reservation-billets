export { };
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/user.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const { listUsers, updateUser } = require('../../validations/user.validation');

const router = express.Router();

router.param('userId', controller.load);

router
  .route('/')
  .get(authorize(), validate(listUsers), controller.list)

router.route('/profile').get(authorize(), controller.loggedIn);

router
  .route('/:userId')

  .get(authorize(LOGGED_USER), controller.get)

  .patch(authorize(LOGGED_USER), validate(updateUser), controller.update)
  .delete(authorize(LOGGED_USER), controller.remove);

module.exports = router;
