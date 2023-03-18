import { NextFunction, Request, Response, Router } from 'express';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
import { Billet } from '../models';
import { apiJson } from '../utils/Utils';
const { handler: errorHandler } = require('../middlewares/error');

exports.load = async (req: Request, res: Response, next: NextFunction, id: any) => {
  try {
    const billet = await Billet.get(id);
    req.route.meta = req.route.meta || {};
    req.route.meta.billet = billet;
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

exports.getByTrajectOpen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query.status = 'open';
    req.query.traject = req.params.traject;

    const data = (await Billet.list(req)).transform(req);

    apiJson({ req, res, data, model: Billet });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};
exports.getByTrajectReserved = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query.status = 'reserved';
    req.query.traject = req.params.traject;

    const data = (await Billet.list(req)).transform(req);
    apiJson({ req, res, data, model: Billet });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};
exports.create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const billet = new Billet({ ...req.body });
    const savedBillet = await billet.save();
    res.status(httpStatus.CREATED);
    res.json(savedBillet.transform());
  } catch (error) {
    next(error);
  }
};

exports.update = (req: Request, res: Response, next: NextFunction) => {
  const billet = Object.assign(req.route.meta.billet, req.body);

  billet
    .save()
    .then((savedBillet: any) => res.json(savedBillet.transform()))
    .catch((e: any) => next(e));
};

exports.list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = (await Billet.list(req)).transform(req);
    apiJson({ req, res, data, model: Billet });
  } catch (e) {
    next(e);
  }
};
exports.listOpen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.query.status = 'open';
    const data = (await Billet.list(req)).transform(req);
    apiJson({ req, res, data, model: Billet });
  } catch (e) {
    next(e);
  }
};
exports.get = async (req: Request, res: Response, next: NextFunction) => {
  res.json(req.route.meta.billet);
};

exports.remove = (req: Request, res: Response, next: NextFunction) => {
  const { billet } = req.route.meta;
  billet
    .remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e: any) => next(e));
};
