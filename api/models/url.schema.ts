import {
  Document,
  model,
  ObjectId,
  Schema,
  SchemaOptions,
  SchemaTimestampsConfig
} from "mongoose";
import { MongoError } from "mongodb";
import bcrypt from "bcryptjs";

import { ErrorCapture } from "../utils/error_capture";
import type { QrStyle } from "../services/qr.service";

export interface IVisit {
  at: Date;
  ip: string;
  country: string;
  city: string;
  region: string;
  geoStatus: 'queued' | 'done' | 'failed';
}

export interface IUrl extends Document<string>, SchemaTimestampsConfig {
  title: string,
  shortUrl: string,
  originUrl: string,
  isPrivate: boolean,
  password?: string,
  hasPassword: boolean,
  passKey?: string,
  description?: string,
  visitCount: number,
  qrCode?: string,
  qrOptions?: QrStyle,
  visits: IVisit[],
  owner: ObjectId,
  comparePassword(password: string): Promise<boolean>,
  comparePassKey(passKey: string): boolean
}

const UrlSchema = new Schema<IUrl>({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true
  },
  originUrl: {
    type: String,
    required: true
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false
  },
  password: {
    type: String,
    required: function() {
      return this.isPrivate;
    }
  },
  passKey: {
    type: String,
    required: function() {
      return !!this.password;
    }
  },
  description: {
    type: String
  },
  visitCount: {
    type: Number,
    required: true,
    default: 0
  },
  qrCode: {
    type: String
  },
  qrOptions: {
    type: {
      darkColor: String,
      lightColor: String,
      transparentBg: Boolean,
      moduleShape: String,
      errorLevel: String,
      frameText: String,
      logo: String,
    },
    required: false,
    _id: false,
  },
  visits: {
    type: [{
      at: { type: Date, required: true },
      ip: { type: String, required: true },
      country: { type: String, default: '' },
      city: { type: String, default: '' },
      region: { type: String, default: '' },
      geoStatus: { type: String },
    }],
    default: [],
    _id: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  }
}, {
  timestamps: true
});

const hasPassword = (schema: Schema, options: SchemaOptions) => {
  schema.virtual('hasPassword')
    .get(function() {return !!this.password})
};

UrlSchema.plugin(hasPassword);

UrlSchema.pre('save', async function(this: IUrl, next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (!this.isPrivate || !this.password) {
    return next()
  }

  const passwordHash = await bcrypt.hash(this.password!, 8);
  this.password! = passwordHash;

  next();
});

UrlSchema.post('save', { errorHandler: true}, function(error, doc, next) {
  if ((error as MongoError).code === 11000 && error.name === 'MongoServerError') {
    next(new ErrorCapture('link already exists'));
  } else {
    next(new ErrorCapture(error.message, 500));
  }
});

UrlSchema.method('comparePassword', async function(this: IUrl, password: string) {
  if (!this.isPrivate || !password) {
    throw new ErrorCapture('link is not private or has no password');
  }

  if (!this.password) return false;

  const match = await bcrypt.compare(password, this.password);
  return match;
});

UrlSchema.method('comparePassKey', function (this: IUrl, passKey: string) {
  return passKey === this.passKey;
});

export default model<IUrl>('url', UrlSchema);