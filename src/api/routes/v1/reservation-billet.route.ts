export {};
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/reservation-billet.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router.param('reservationBillet', controller.load);

router
  .route('/')

  .get(authorize(), controller.list)

  .post(authorize(), controller.create);

router
  .route('/cancel/:reservationBillet')

  .patch(authorize(), controller.cancel);

router
  .route('/:reservationBillet')

  .get(authorize(), controller.get)

  .patch(authorize(), controller.update)

  .delete(authorize(), controller.remove);
router.route('/verify-reservation/:token').post(controller.verifyReservation);
router.route('/verify-cancel-reservation/:token').post(controller.verifyCancelReservation);

module.exports = router;
