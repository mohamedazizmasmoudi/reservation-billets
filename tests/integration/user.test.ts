/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
export {};
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const { some, omitBy, isNil } = require('lodash');
const app = require('../../src/index');
import { User } from '../../src/api/models';
const JWT_EXPIRATION_MINUTES = require('../../src/config/vars').JWT_EXPIRATION_MINUTES;

/**
 * root level hooks
 */

async function format(user: any) {
  const formated = user;

  // delete password
  delete formated.password;

  // get users from database
  const dbUser = (await User.findOne({ email: user.email })).transform();

  // remove null and undefined properties
  return omitBy(dbUser, isNil);
}

describe('Users API', async () => {
  let adminAccessToken: any;
  let userAccessToken: any;
  let dbUsers: any;
  let user: any;
  let admin: any;

  const password = '123456';
  const passwordHashed = await bcrypt.hash(password, 1);

  beforeEach(async () => {
    dbUsers = {
      branStark: {
        email: 'branstark@gmail.com',
        password: passwordHashed,
        name: 'Bran Stark'
      },
      jonSnow: {
        email: 'jonsnow@gmail.com',
        password: passwordHashed,
        name: 'Jon Snow'
      }
    };

    user = {
      email: 'sousa.dfs@gmail.com',
      password,
      name: 'Daniel Sousa'
    };

    admin = {
      email: 'sousa.dfs@gmail.com',
      password,
      name: 'Daniel Sousa'
    };

    await User.remove({});
    await User.insertMany([dbUsers.branStark, dbUsers.jonSnow]);
    dbUsers.branStark.password = password;
    dbUsers.jonSnow.password = password;
    adminAccessToken = (await User.findAndGenerateToken(dbUsers.branStark)).accessToken;
    userAccessToken = (await User.findAndGenerateToken(dbUsers.jonSnow)).accessToken;
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user when request is ok', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(admin)
        .expect(httpStatus.CREATED)
        .then((res: any) => {
          delete admin.password;
          expect(res.body).to.include(admin);
        });
    });

    it('should report error when email already exists', () => {
      user.email = dbUsers.branStark.email;

      return request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.CONFLICT)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" already exists');
        });
    });

    it('should report error when email is not provided', () => {
      delete user.email;

      return request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field[0]).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error when password length is less than 6', () => {
      user.password = '12345';

      return request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field[0]).to.be.equal('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });

    it('should report error when logged user is not an admin', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(user)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then(async (res: any) => {
          const bran = await format(dbUsers.branStark);
          const john = await format(dbUsers.jonSnow);

          const { data } = res.body;

          // before comparing it is necessary to convert String to Date
          data[0].createdAt = new Date(data[0].createdAt);
          data[1].createdAt = new Date(data[1].createdAt);

          expect(data).to.be.an('array');
          expect(data).to.have.lengthOf(2);
          expect(some(data, bran)).to.be.true; // includesBranStark
          expect(some(data, john)).to.be.true; // includesjonSnow
        });
    });

    it('should get users with pagination - with perPage', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 2, perPage: 1 })
        .expect(httpStatus.OK)
        .then(async (res: any) => {
          delete dbUsers.jonSnow.password;
          const john = await format(dbUsers.jonSnow);
          const { data } = res.body;

          // before comparing it is necessary to convert String to Date
          data[0].createdAt = new Date(data[0].createdAt);

          expect(data).to.be.an('array');
          expect(data).to.have.lengthOf(1);
          expect(some(data, john)).to.be.true; // includesjonSnow
        });
    });

    it('should get users with pagination - with offset, limit', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ offset: 1, limit: 1 })
        .expect(httpStatus.OK)
        .then(async (res: any) => {
          delete dbUsers.jonSnow.password;
          const john = await format(dbUsers.jonSnow);
          const { data } = res.body;

          // before comparing it is necessary to convert String to Date
          data[0].createdAt = new Date(data[0].createdAt);

          expect(data).to.be.an('array');
          expect(data).to.have.lengthOf(1);
          expect(some(data, john)).to.be.true; // includesjonSnow
        });
    });

    it('should filter users', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ email: dbUsers.jonSnow.email })
        .expect(httpStatus.OK)
        .then(async (res: any) => {
          delete dbUsers.jonSnow.password;
          const john = await format(dbUsers.jonSnow);

          const { data } = res.body;

          // before comparing it is necessary to convert String to Date
          data[0].createdAt = new Date(data[0].createdAt);

          expect(data).to.be.an('array');
          expect(data).to.have.lengthOf(1);
          expect(some(data, john)).to.be.true; // includesjonSnow
        });
    });

    it("should report error when pagination's parameters are not a number", () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: '?', perPage: 'whaat' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field[0]).to.be.equal('page');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"page" must be a number');
          return Promise.resolve(res);
        })
        .then((res: any) => {
          const { field } = res.body.errors[1];
          const { location } = res.body.errors[1];
          const { messages } = res.body.errors[1];
          expect(field[0]).to.be.equal('perPage');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"perPage" must be a number');
        });
    });

    it('should report error if logged user is not an admin', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should get user', async () => {
      const id = (await User.findOne({}))._id;
      delete dbUsers.branStark.password;

      return request(app)
        .get(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK)
        .then((res: any) => {
          expect(res.body).to.include(dbUsers.branStark);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .get('/api/v1/users/56c787ccc67fc16ccc1a5e92')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error "User does not exist" when id is not a valid ObjectID', () => {
      return request(app)
        .get('/api/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.branStark.email }))._id;

      return request(app)
        .get(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('PUT /api/v1/users/:userId', () => {
    it('should replace user', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;

      return request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.OK)
        .then((res: any) => {
          delete user.password;
          expect(res.body).to.include(user);
        });
    });

    it('should report error when email is not provided', async () => {
      const id = (await User.findOne({}))._id;
      delete user.email;

      return request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field[0]).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error user when password length is less than 6', async () => {
      const id = (await User.findOne({}))._id;
      user.password = '12345';

      return request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res: any) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field[0]).to.be.equal('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .put('/api/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.branStark.email }))._id;

      return request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    it('should update user', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;
      const { name } = user;

      return request(app)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name })
        .expect(httpStatus.OK)
        .then((res: any) => {
          expect(res.body.name).to.be.equal(name);
          expect(res.body.email).to.be.equal(dbUsers.branStark.email);
        });
    });

    it('should not update user when no parameters were given', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;

      return request(app)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK)
        .then((res: any) => {
          expect(res.body).to.include(dbUsers.branStark);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .patch('/api/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.branStark.email }))._id;

      return request(app)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('DELETE /api/v1/users', () => {
    it('should delete user', async () => {
      const id = (await User.findOne({}))._id;

      return request(app)
        .delete(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT)
        .then(() => request(app).get('/api/v1/users'))
        .then(async () => {
          const users = await User.find({});
          expect(users).to.have.lengthOf(1);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .delete('/api/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error when logged user is not the same as the requested one', async () => {
      const id = (await User.findOne({ email: dbUsers.branStark.email }))._id;

      return request(app)
        .delete(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.FORBIDDEN)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.FORBIDDEN);
          expect(res.body.message).to.be.equal('Forbidden');
        });
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it("should get the logged user's info", () => {
      delete dbUsers.jonSnow.password;

      return request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.OK)
        .then((res: any) => {
          expect(res.body).to.include(dbUsers.jonSnow);
        });
    });

    it('should report error without stacktrace when accessToken is expired', async () => {
      // fake time
      const clock = sinon.useFakeTimers();
      const expiredAccessToken = (await User.findAndGenerateToken(dbUsers.branStark)).accessToken;

      // move clock forward by minutes set in config + 1 minute
      clock.tick(JWT_EXPIRATION_MINUTES * 60000 + 60000);

      return request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res: any) => {
          expect(res.body.code).to.be.equal(httpStatus.UNAUTHORIZED);
          expect(res.body.message).to.be.equal('jwt expired');
          expect(res.body).to.not.have.a.property('stack');
        });
    });
  });
});
