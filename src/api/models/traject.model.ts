const mongoose = require('mongoose');
import { required } from 'joi';
import { transformData, listData } from '../utils/ModelUtils';
const APIError = require('../../api/utils/APIError');
const httpStatus = require('http-status');

const TrajectSchema = new mongoose.Schema(
  {
    nom: { type: String, default: '' },

  },
  { timestamps: true }
);
const ALLOWED_FIELDS = ['id', 'nom', 'logo', 'description', 'qrCode', 'pays', 'cover', 'address', 'createdAt'];

TrajectSchema.method({
  // query is optional, e.g. to transform data for response but only include certain "fields"
  transform({ query = {} }: { query?: any } = {}) {
    // transform every record (only respond allowed fields and "&fields=" in query)
    return transformData(this, query, ALLOWED_FIELDS);
  }
});

TrajectSchema.statics = {
  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id: any) {
    try {
      let data;

      if (mongoose.Types.ObjectId.isValid(id)) {
        data = await this.findById(id).exec();
      }
      if (data) {
        return data;
      }

      throw new APIError({
        message: 'Traject does not exist',
        status: httpStatus.NOT_FOUND
      });
    } catch (error) {
      throw error;
    }
  },
  list({ query }: { query: any }) {
    return listData(this, query, ALLOWED_FIELDS);
  }
};

const Traject = mongoose.model('traject', TrajectSchema);
Traject.ALLOWED_FIELDS = ALLOWED_FIELDS;

module.exports = Traject;
