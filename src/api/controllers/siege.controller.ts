import { NextFunction, Request, Response, Router } from 'express';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
import { Siege } from '../models';
import { apiJson } from '../utils/Utils';
const { handler: errorHandler } = require('../middlewares/error');

exports.load = async (req: Request, res: Response, next: NextFunction, id: any) => {
  try {
    const siege = await Siege.get(id);
    req.route.meta = req.route.meta || {};
    req.route.meta.siege = siege;
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

exports.create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siege = new Siege({ ...req.body });
    const savedSiege = await siege.save();
    res.status(httpStatus.CREATED);
    res.json(savedSiege.transform());
  } catch (error) {
    next(error);
  }
};

exports.update = (req: Request, res: Response, next: NextFunction) => {
  const siege = Object.assign(req.route.meta.siege, req.body);

  siege
    .save()
    .then((savedSiege: any) => res.json(savedSiege.transform()))
    .catch((e: any) => next(e));
};

exports.list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = (await Siege.list(req)).transform(req);
    apiJson({ req, res, data, model: Siege });
  } catch (e) {
    next(e);
  }
};

exports.listWithTrajects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await Siege.aggregate([
      {
        $lookup: {
          from: 'trajects',
          localField: 'restaurant_name',
          foreignField: 'name',
          let: { id: '$_id' },
          pipeline: [{ $match: { $expr: { $in: ['$$id', '$sieges'] } } }],
          as: 'trajects'
        }
      },
      {
        $addFields: { 'trajectsNumber ': { $size: '$trajects' } }
      }
    ]).allowDiskUse(true);
    res.status(httpStatus.CREATED);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.get = async (req: Request, res: Response, next: NextFunction) => {
  res.json(req.route.meta.siege);
};

exports.remove = (req: Request, res: Response, next: NextFunction) => {
  const { siege } = req.route.meta;
  siege
    .remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e: any) => next(e));
};
