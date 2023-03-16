import { NextFunction, Request, Response, Router } from 'express';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
import { Traject } from '../models';
import { apiJson } from '../utils/Utils';
const { handler: errorHandler } = require('../middlewares/error');

exports.load = async (req: Request, res: Response, next: NextFunction, id: any) => {
  try {
    const traject = await Traject.get(id);
    req.route.meta = req.route.meta || {};
    req.route.meta.traject = traject;
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};


exports.create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const traject = new Traject({ ...req.body });
    const savedTraject = await traject.save();
    res.status(httpStatus.CREATED);
    res.json(savedTraject.transform());
  } catch (error) {
    next(error);
  }
};


exports.update = (req: Request, res: Response, next: NextFunction) => {
  const traject = Object.assign(req.route.meta.traject, req.body);

  traject
    .save()
    .then((savedTraject: any) => res.json(savedTraject.transform()))
    .catch((e: any) => next(e));
};


exports.list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = (await Traject.list(req)).transform(req);
    apiJson({ req, res, data, model: Traject });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req: Request, res: Response, next: NextFunction) => {
  res.json(req.route.meta.traject);
};

exports.remove = (req: Request, res: Response, next: NextFunction) => {
  const { traject } = req.route.meta;
  traject
    .remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e: any) => next(e));
};
