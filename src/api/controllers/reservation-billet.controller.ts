import { NextFunction, Request, Response, Router } from 'express';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
import { Billet, ReservationBillet } from '../../api/models';
import { apiJson } from '../../api/utils/Utils';
const { handler: errorHandler } = require('../middlewares/error');
import * as crypto from 'crypto';
import { sendEmail, verifyCancelReservationBillet, verifyReserveBillet } from '../../api/utils/MsgUtils';

exports.load = async (req: Request, res: Response, next: NextFunction, id: any) => {
  try {
    const reservationBillet = await ReservationBillet.get(id);
    req.route.meta = req.route.meta || {};
    req.route.meta.reservationBillet = reservationBillet;
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

exports.create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { connectedUser } = req.route.meta;
    let reservationBillet = new ReservationBillet({ ...req.body });
    const tempPass = `${connectedUser._id}.${crypto.randomBytes(40).toString('hex')}`;
    reservationBillet.verifyToken = tempPass;
    reservationBillet.verifyToken = tempPass;
    const savedReservationBillet = await reservationBillet.save();
    let billet = await Billet.get(req.body.billet);
    billet.status = 'reserved';
    billet.save();
    sendEmail(verifyReserveBillet({ name: connectedUser.firstName, email: connectedUser.email, tempPass }));
    res.status(httpStatus.CREATED);
    res.json(savedReservationBillet.transform());
  } catch (error) {
    next(error);
  }
};

exports.verifyReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    console.log('req.params', req.params);
    const reservationBillet = await ReservationBillet.findOne({ verifyToken: token });
    if (!reservationBillet) {
      // RETURN A GENERIC ERROR - DON'T EXPOSE the real reason (user not found) for security.
      return next({ message: 'Invalid request' });
    }
    // user found => generate temp password, then email it to user:
    reservationBillet.verified = true;
    await reservationBillet.save();

    return apiJson({ req, res, data: { status: 'OK' } });
  } catch (error) {
    return next(error);
  }
};

exports.update = (req: Request, res: Response, next: NextFunction) => {
  const reservationBillet = Object.assign(req.route.meta.reservationBillet, req.body);

  reservationBillet
    .save()
    .then((savedReservationBillet: any) => res.json(savedReservationBillet.transform()))
    .catch((e: any) => next(e));
};
exports.cancel = (req: Request, res: Response, next: NextFunction) => {
  const { connectedUser } = req.route.meta;
  const tempPass = `${connectedUser._id}.${crypto.randomBytes(40).toString('hex')}`;
  let reservationBillet = req.route.meta.reservationBillet;
  reservationBillet.verifyToken = tempPass;
  reservationBillet
    .save()
    .then(async (savedReservationBillet: any) => {
      sendEmail(verifyCancelReservationBillet({ name: connectedUser.firstName, email: connectedUser.email, tempPass }));

      res.json(savedReservationBillet.transform());
    })
    .catch((e: any) => next(e));
};
exports.verifyCancelReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    console.log('req.params', req.params);
    const reservationBillet = await ReservationBillet.findOne({ verifyToken: token });

    if (!reservationBillet) {
      // RETURN A GENERIC ERROR - DON'T EXPOSE the real reason (user not found) for security.
      return next({ message: 'Invalid request' });
    }
    // user found => generate temp password, then email it to user:
    reservationBillet.status = 'canceled';
    await reservationBillet.save();
    let billet = await Billet.get(reservationBillet.billet);
    billet.status = 'open';
    billet.save();

    return apiJson({ req, res, data: { status: 'OK' } });
  } catch (error) {
    return next(error);
  }
};

exports.list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query.verified = 'true';
    const data = (await ReservationBillet.list(req)).transform(req);
    apiJson({ req, res, data, model: ReservationBillet });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req: Request, res: Response, next: NextFunction) => {
  res.json(req.route.meta.reservationBillet);
};

exports.remove = (req: Request, res: Response, next: NextFunction) => {
  const { reservationBillet } = req.route.meta;
  reservationBillet
    .remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e: any) => next(e));
};
