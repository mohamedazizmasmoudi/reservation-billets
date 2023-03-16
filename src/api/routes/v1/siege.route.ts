export { };
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/siege.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();


router.param('siege', controller.load);

router
  .route('/')

  .get(authorize(), controller.list)

  .post(authorize(), controller.create);

router
  .route('/:siege')

  .get(authorize(), controller.get)

  .patch(authorize(), controller.update)

  .delete(authorize(), controller.remove);

module.exports = router;
