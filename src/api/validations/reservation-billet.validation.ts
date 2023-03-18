export {};
import * as Joi from 'joi';
import { ReservationBillet } from '../models';

const postPutBody = () => {
  return {
    billet: Joi.string().max(128),
    user: Joi.string().max(128)
  };
};

module.exports = {
  listReservationBillets: {
    query: {
      limit: Joi.number().min(1).max(9999),
      offset: Joi.number().min(0),
      page: Joi.number().min(0),
      perPage: Joi.number().min(1),
      sort: Joi.string(),
      billet: Joi.string(),
      user: Joi.string()
    }
  },

  createReservationBillet: {
    body: postPutBody()
  },

  updateReservationBillet: {
    body: {
      billet: Joi.string().max(128),
      user: Joi.string().max(128)
    },
    params: {
      reservationBillet: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required()
    }
  }
};
