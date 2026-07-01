import { ObjectId, SaveOptions } from 'mongoose';
import { nanoid } from 'nanoid';

import { IUrl, UrlDB } from '../models';

import { ErrorCapture } from '../utils/error_capture';
import { apiUrl } from '../utils/envs';

export const create = (data: IUrl) => {
  const id = nanoid(8);
  const passKey = !!data.password ? nanoid(16) : undefined;

  const short = `${apiUrl}/o/${id}`;

  return new UrlDB({
    _id: id,
    title: data.title,
    shortUrl: short,
    originUrl: data.originUrl,
    isPrivate: data.isPrivate,
    password: data.password,
    passKey: passKey,
    description: data.description,
    owner: data.owner,
  });
};

export const getById = async (id: string | ObjectId) => {
  const url = await UrlDB.findById(id);
  if (!url) throw new ErrorCapture('link not found', 404);

  return url;
};

export const getSome = async (filter?: object) => {
  const urls = await UrlDB.find(filter ?? {}, '-owner -visits').sort('-updatedAt');

  return urls;
};

export const saveUpdate = async (url: IUrl, options?: SaveOptions) => {
  if (!url.isNew && url.isModified('password')) {
    url.passKey = nanoid(16);
  }

  url = await url.save({
    timestamps: options?.timestamps ?? true,
  });
  return url;
};

export const destroy = async (shortId: string | ObjectId) => {
  const res = await UrlDB.deleteOne({ _id: shortId });

  if (!res.deletedCount) throw new ErrorCapture('link does not exist', 404);
};
