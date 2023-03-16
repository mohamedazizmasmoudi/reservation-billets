export { };
import * as express from 'express';
import { apiJson } from '../../../api/utils/Utils';

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const reservationBilletRoutes = require('./reservation-billet.route');
const billetRoutes = require('./billet.route');
const trajectRoutes = require('./traject.route');
const siegeRoutes = require('./siege.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res, next) => {
  apiJson({ req, res, data: { status: 'OK' } });
  return next();
});

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/reservationBillets', reservationBilletRoutes);
router.use('/billets', billetRoutes);
router.use('/trajects', trajectRoutes);
router.use('/sieges', siegeRoutes);



module.exports = router;
