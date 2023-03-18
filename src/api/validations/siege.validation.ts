export {};
import * as Joi from 'joi';
import { Siege } from '../models';

const postPutBody = () => {
  return {
    nom: Joi.string().max(128)
    // role: Joi.string().valid(Siege.roles)
  };
};

module.exports = {
  listSieges: {
    query: {
      limit: Joi.number().min(1).max(9999),
      offset: Joi.number().min(0),
      page: Joi.number().min(0),
      perPage: Joi.number().min(1),
      sort: Joi.string(),
      nom: Joi.string()
    }
  },

  createSiege: {
    body: postPutBody()
  },

  updateSiege: {
    body: {
      nom: Joi.string().max(128)
    },
    params: {
      siege: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required()
    }
  }
};
