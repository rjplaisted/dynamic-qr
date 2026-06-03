export interface Account {
  name: string,
  username: string,
  email: string
}

export interface QrOptions {
  darkColor: string;
  lightColor: string;
  transparentBg: boolean;
  moduleShape: 'square' | 'dot' | 'rounded';
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  frameText?: string;
  logo?: string;
}

export interface Link {
  _id: string,
  title: string,
  shortUrl: string,
  originUrl: string,
  isPrivate: boolean,
  hasPassword: boolean,
  description?: string,
  visitCount: number,
  qrCode?: string,
  qrOptions?: QrOptions,
  createdAt: string,
  updatedAt: string
}

export interface Visit {
  at: string;
  ip: string;
  country: string;
  city: string;
  region: string;
  geoStatus?: 'queued' | 'done' | 'failed';
}

export interface Notif {
  status: 'success' | 'error',
  title?: string,
  message: string
}