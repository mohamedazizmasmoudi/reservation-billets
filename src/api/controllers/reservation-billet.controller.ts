import { NextFunction, Request, Response, Router } from 'express';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
import { ReservationBillet } from '../../api/models';
import { apiJson } from '../../api/utils/Utils';
const { handler: errorHandler } = require('../middlewares/error');

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
    const reservationBillet = new ReservationBillet({ ...req.body });
    const savedReservationBillet = await reservationBillet.save();
    res.status(httpStatus.CREATED);
    res.json(savedReservationBillet.transform());
  } catch (error) {
    next(error);
  }
};


exports.update = (req: Request, res: Response, next: NextFunction) => {
  const reservationBillet = Object.assign(req.route.meta.reservationBillet, req.body);

  reservationBillet
    .save()
    .then((savedReservationBillet: any) => res.json(savedReservationBillet.transform()))
    .catch((e: any) => next(e));
};


exports.list = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
