export { };
const mongoose = require('mongoose');
import { transformData, listData } from '../utils/ModelUtils';
const APIError = require('../../api/utils/APIError');
const httpStatus = require('http-status');

const status = ['activated', 'canceled'];
const ReservationBilletSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: status,
      default: 'activated'
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    billet: { type: mongoose.Schema.Types.ObjectId, ref: 'Billet' }
  },
  { timestamps: true }
);
const ALLOWED_FIELDS = ['id', 'status', 'User', 'Billet', 'createdAt'];

ReservationBilletSchema.method({
  // query is optional, e.g. to transform data for response but only include certain "fields"
  transform({ query = {} }: { query?: any } = {}) {
    // transform every record (only respond allowed fields and "&fields=" in query)
    return transformData(this, query, ALLOWED_FIELDS);
  }
});

ReservationBilletSchema.statics = {
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
        message: 'reservationBillet does not exist',
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

const ReservationBillet = mongoose.model('reservationBillet', ReservationBilletSchema);
ReservationBillet.ALLOWED_FIELDS = ALLOWED_FIELDS;

module.exports = ReservationBillet;
