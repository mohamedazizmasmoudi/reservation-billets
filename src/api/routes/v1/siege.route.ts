export {};
const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/siege.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const { listSieges, updateSiege, createSiege } = require('../../validations/siege.validation');

const router = express.Router();

router.param('siege', controller.load);

router
  .route('/listWithTrajects')

  .get(authorize(), controller.listWithTrajects);

router
  .route('/')

  .get(authorize(), validate(listSieges), controller.list)

  .post(authorize(), validate(createSiege), controller.create);

router
  .route('/:siege')

  .get(authorize(), controller.get)

  .patch(authorize(), validate(updateSiege), controller.update)

  .delete(authorize(), controller.remove);

module.exports = router;
