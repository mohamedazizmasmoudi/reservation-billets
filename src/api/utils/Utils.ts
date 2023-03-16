import { NextFunction, Request, Response, Router } from 'express';
import { ITEMS_PER_PAGE } from '../../api/utils/Const';

export function jsonClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

// from "sort" string (URL param) => build sort object (mongoose), e.g. "sort=name:desc,age"
export function getSortQuery(sortStr: string, defaultKey = 'createdAt') {
  let arr = [sortStr || defaultKey];
  if (sortStr && sortStr.indexOf(',')) {
    arr = sortStr.split(',');
  }
  let ret = {};
  for (let i = 0; i < arr.length; i += 1) {
    let order = 1; // default: ascending (a-z)
    let keyName = arr[i].trim();
    if (keyName.indexOf(':') >= 0) {
      const [keyStr, orderStr] = keyName.split(':'); // e.g. "name:desc"
      keyName = keyStr.trim();
      order = orderStr.trim() === 'desc' || orderStr.trim() === '-1' ? -1 : 1;
    }
    ret = { ...ret, [keyName]: order };
  }
  return ret;
}

// from "req" (req.query) => transform to: query object, e.g. { limit: 5, sort: { name: 1 } }
export function getPageQuery(reqQuery: any) {
  if (!reqQuery) {
    return null;
  }
  const output: any = {};
  if (reqQuery.page) {
    output.perPage = reqQuery.perPage || ITEMS_PER_PAGE; // if page is set => take (or set default) perPage
  }
  if (reqQuery.fields) {
    output.fields = reqQuery.fields.split(',').map((field: string) => field.trim()); // to array
  }
  // number (type) query params => parse them:
  const numParams = ['page', 'perPage', 'limit', 'offset'];
  numParams.forEach((field) => {
    if (reqQuery[field]) {
      output[field] = parseInt(reqQuery[field], 10);
    }
  });
  output.sort = getSortQuery(reqQuery.sort, 'createdAt');
  return output;
}

// normalize req.query to get "safe" query fields => return "query" obj for mongoose (find, etc.)
export function getMongoQuery(reqQuery: any, fieldArray: string[]) {
  const queryObj: any = {};
  fieldArray.map((field) => {
    // get query fields excluding pagination fields:
    if (['page', 'perPage', 'limit', 'offset'].indexOf(field) < 0 && reqQuery[field]) {
      // TODO: do more checks of query parameters for better security...
      let val = reqQuery[field];
      if (typeof val === 'string' && val.length >= 2 && (val[0] === '*' || val[val.length - 1] === '*')) {
        // field value has "*text*" => use MongoDB Regex query: (partial text search)
        val = val.replace(/\*/g, ''); // remove "*"
        val = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape other special chars - https://goo.gl/eWCVDH
        queryObj[field] = { $regex: val, $options: 'i' };
      } else {
        queryObj[field] = reqQuery[field]; // exact search
      }
    }
  });
  console.log('- queryObj: ', JSON.stringify(queryObj));
  return queryObj;
}

// function to decorate a promise with useful helpers like: .transform(), etc.
// @example: return queryPromise( this.find({}) )
export function queryPromise(mongoosePromise: any) {
  return new Promise(async (resolve) => {
    const items = await mongoosePromise;

    // decorate => transform() on the result
    items.transform = (params: any) => {
      return items.map((item: any) => (item.transform ? item.transform(params) : item));
    };
    resolve(items);
  });
}

type apiJsonTypes = {
  req: Request;
  res: Response;
  data: any | any[]; // data can be object or array
  model?: any; // e.g. "listModal: User" to get meta.totalCount (User.countDocuments())
  meta?: any;
  json?: boolean; // retrieve JSON only (won't use res.json(...))
};
/**
 * prepare a standard API Response, e.g. { meta: {...}, data: [...], errors: [...] }
 * @param param0
 */
export async function apiJson({ req, res, data, model, meta = {}, json = false }: apiJsonTypes) {
  const queryObj = getPageQuery(req.query);
  const metaData = { ...queryObj, ...meta };

  if (model) {
    // if pass in "model" => query for totalCount & put in "meta"
    const isPagination = req.query.limit || req.query.page;
    if (isPagination && model.countDocuments) {
      const query = getMongoQuery(req.query, model.ALLOWED_FIELDS);
      const countQuery = jsonClone(query);
      const totalCount = await model.countDocuments(countQuery);
      metaData.totalCount = totalCount;
      if (queryObj.perPage) {
        metaData.pageCount = Math.ceil(totalCount / queryObj.perPage);
      }
      metaData.count = data && data.length ? data.length : 0;
    }
  }

  const output = { data, meta: metaData };
  if (json) {
    return output;
  }
  return res.json(output);
}

export function randomString(len = 10, charStr = 'abcdefghijklmnopqrstuvwxyz0123456789') {
  const chars = [...`${charStr}`];
  return [...Array(len)].map((i) => chars[(Math.random() * chars.length) | 0]).join('');
}
