export {};
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/billet.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router.param('billet', controller.load);

router
  .route('/')

  .get(authorize(), controller.list)

  .post(authorize(), controller.create);
router
  .route('/open')

  .get(authorize(), controller.listOpen);
router
  .route('/open/:traject')

  .get(authorize(), controller.getByTrajectOpen);
router
  .route('/reserved/:traject')

  .get(authorize(), controller.getByTrajectReserved);

router
  .route('/:billet')

  .get(authorize(), controller.get)

  .patch(authorize(), controller.update)

  .delete(authorize(), controller.remove);

module.exports = router;
