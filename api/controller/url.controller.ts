import { NextFunction, Request, Response } from 'express';

import { createQr, createQrSvg, UrlService, enqueueGeoLookup } from '../services';
import { UrlDB } from '../models';

import { urlResponse } from '../transformer/response';
import { ErrorCapture } from '../utils/error_capture';
import { schemeFiller } from '../utils/filler';
import { cookieOptions, createPassPage } from '../middlewares/auth.handler';
import { webHost } from '../utils/envs';

export const createShortUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;
    const data = req.body;

    data.owner = claimId;
    const url = UrlService.create(data);

    if (data.plusQr) {
      url.qrCode = await createQr(url.shortUrl, data.qrOptions);
    }

    if (data.qrOptions) {
      url.qrOptions = data.qrOptions;
    }

    await UrlService.saveUpdate(url);

    res.content = {
      status: 'success',
      code: 201,
      data: urlResponse(url),
    };
    res.logMessage = `[${url._id}] created by ${claimId}`;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const getOriginUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shortId } = req.params;
    const url = await UrlService.getById(shortId);

    if (url.isPrivate) {
      if (!req.passKey) {
        const passPage = await createPassPage(url);
        return res.status(200).send(passPage);
      }

      const match = url.comparePassKey(req.passKey);
      if (!match) {
        res.cookie(
          `o.${url.id}`,
          '',
          Object.assign({}, cookieOptions, {
            domain: webHost,
            path: `/o/${url.id}`,
            expires: new Date(1),
            maxAge: 10,
          }),
        );

        const passPage = await createPassPage(url);
        return res.status(200).send(passPage);
      }
    }

    url.visitCount += 1;
    const rawIp = req.ip || 'unknown';
    const ip = rawIp.replace('::ffff:', '');
    const visitAt = new Date();
    url.visits.push({ at: visitAt, ip, country: '', city: '', region: '', geoStatus: 'queued' });
    await UrlService.saveUpdate(url, { timestamps: false });
    enqueueGeoLookup(url.id, ip, visitAt);

    res.content = {
      status: 'redirect',
      code: 302,
      to: schemeFiller(url.originUrl),
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const getOneUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;
    const { shortId } = req.params;

    const url = await UrlService.getById(shortId);

    res.content = {
      status: 'success',
      code: 200,
      data: urlResponse(url),
    };

    res.logMessage = `${claimId} fetch ${url._id}`;
    return next();
  } catch (error) {
    return next(error);
  }
};

// TODO: implement pagination
export const getAllUrls = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;

    const urls = await UrlService.getSome();

    res.content = {
      status: 'success',
      code: 200,
      data: urls.map((url) => urlResponse(url)),
      metadata: {
        data_length: urls.length,
      },
    };

    res.logMessage = `${claimId} fetch all urls`;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const updateUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;
    const data = req.body;
    const { shortId } = req.params;

    const url = await UrlService.getById(shortId);

    url.title = data.title ?? url.title;
    url.originUrl = data.originUrl ?? url.originUrl;
    url.isPrivate = data.isPrivate ?? url.isPrivate;

    if (url.isPrivate && !url.password && !data.password)
      throw new ErrorCapture('required fields are missing or invalid', 400);

    if (url.isPrivate && !!data.password) {
      const match = await url.comparePassword(data.password);
      if (match)
        throw new ErrorCapture(
          'password is still the same as it is now, try a newer one',
          409,
        );

      url.password = data.password;
    }

    url.description = data.description ?? url.description;

    if (data.qrOptions) {
      url.qrOptions = data.qrOptions;
    }

    if (!url.qrCode && data.plusQr) {
      url.qrCode = await createQr(url.shortUrl, data.qrOptions ?? url.qrOptions);
    } else if (url.qrCode && data.qrOptions) {
      url.qrCode = await createQr(url.shortUrl, data.qrOptions);
    }

    await UrlService.saveUpdate(url);

    res.content = {
      status: 'empty',
      code: 204,
    };

    res.logMessage = `[${url._id}] update successful`;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const removeUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;
    const { shortId } = req.params;

    await UrlService.destroy(shortId);

    res.content = {
      status: 'empty',
      code: 205,
    };

    res.logMessage = `[${shortId}] deletion successful, by ${claimId}`;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const getUrlVisits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const claimId = req.userId;
    const { shortId } = req.params;
    const url = await UrlDB.findOne({ _id: shortId }, 'visits');
    if (!url) throw new ErrorCapture('link not found', 404);
    const visits = [...url.visits].sort((a, b) => b.at.getTime() - a.at.getTime());
    res.content = { status: 'success', code: 200, data: visits };
    res.logMessage = `${claimId} fetched visits for ${shortId}`;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const downloadQrSvg = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shortId } = req.params;
    const url = await UrlService.getById(shortId);
    const svg = await createQrSvg(url.shortUrl, url.qrOptions ?? {});
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${shortId}.svg"`);
    res.status(200).send(svg);
  } catch (error) {
    return next(error);
  }
};

export const downloadQrPng = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shortId } = req.params;
    const url = await UrlService.getById(shortId);
    const dataUrl = url.qrCode ?? await createQr(url.shortUrl, url.qrOptions ?? {});
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${shortId}.png"`);
    res.status(200).send(buf);
  } catch (error) {
    return next(error);
  }
};
