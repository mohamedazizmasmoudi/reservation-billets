export { };
const mongoose = require('mongoose');
import { transformData, listData } from '../utils/ModelUtils';
const APIError = require('../../api/utils/APIError');
const httpStatus = require('http-status');

const types = ['vip', 'normal'];
const BilletSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: types,
    },
    traject: { type: mongoose.Schema.Types.ObjectId, ref: 'Traject' }
  },
  { timestamps: true }
);
const ALLOWED_FIELDS = ['id', 'type', 'traject', 'createdAt'];

BilletSchema.method({
  // query is optional, e.g. to transform data for response but only include certain "fields"
  transform({ query = {} }: { query?: any } = {}) {
    // transform every record (only respond allowed fields and "&fields=" in query)
    return transformData(this, query, ALLOWED_FIELDS);
  }
});

BilletSchema.statics = {
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
        message: 'Billet does not exist',
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

const Billet = mongoose.model('billet', BilletSchema);
Billet.ALLOWED_FIELDS = ALLOWED_FIELDS;

module.exports = Billet;
