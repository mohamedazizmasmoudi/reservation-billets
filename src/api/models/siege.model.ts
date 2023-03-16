const mongoose = require('mongoose');
import { transformData, listData } from '../utils/ModelUtils';
const APIError = require('../../api/utils/APIError');
const httpStatus = require('http-status');

const SiegeSchema = new mongoose.Schema(
  {
    nom: { type: String, default: '' },
    traject: { type: mongoose.Schema.Types.ObjectId, ref: 'Traject' }

  },
  { timestamps: true }
);
const ALLOWED_FIELDS = ['id', 'nom', 'createdAt'];

SiegeSchema.method({
  // query is optional, e.g. to transform data for response but only include certain "fields"
  transform({ query = {} }: { query?: any } = {}) {
    // transform every record (only respond allowed fields and "&fields=" in query)
    return transformData(this, query, ALLOWED_FIELDS);
  }
});

SiegeSchema.statics = {

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
        message: 'Siege does not exist',
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

const Siege = mongoose.model('siege', SiegeSchema);
Siege.ALLOWED_FIELDS = ALLOWED_FIELDS;

module.exports = Siege;
