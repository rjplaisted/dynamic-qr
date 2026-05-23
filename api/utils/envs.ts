import dotenv from 'dotenv';

dotenv.config();

export const apiPort = process.env.API_PORT;
export const apiUrl = process.env.API_URL;

export const webHost = process.env.WEB_HOST;
export const WebUrl = process.env.WEB_URL;

export const dbUser = process.env.DB_USER;
export const dbPass = process.env.DB_PASS;
export const dbHost = process.env.DB_HOST;
export const dbPort = process.env.DB_PORT;
export const dbName = process.env.DB_NAME;

// all exp number is seconds unit
export const originKey: string = process.env.ORIGIN_KEY!;
export const originExp: number = +process.env.ORIGIN_EXP!;
export const accessKey: string = process.env.ACCESS_KEY!;
export const accessExp: number = +process.env.ACCESS_EXP!;
export const refreshKey: string = process.env.REFRESH_KEY!;
export const refreshExp: number = +process.env.REFRESH_EXP!;
