import { Router } from "express";
import rateLimit from "express-rate-limit";

import { AuthController } from "../controller";
import { CheckUserAgent } from "../middlewares";
import { AuthValidator, CommonValidator } from "../middlewares/validator";

const AuthRouter = Router();
const LoginRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts, please try again in 15 minutes.' },
});

const registLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many registrations from this IP, please try again later.' },
});

// POST /auth/login/email
// body {email, password}
LoginRouter.post('/email', loginLimiter, AuthValidator.LoginEmail, AuthController.loginByEmail);

// POST /auth/login/username
// body {username, password}
LoginRouter.post('/username', loginLimiter, AuthValidator.LoginUsername, AuthController.loginByUsername);

// /auth/login
// header {User-Agent}
// response {
//   status,
//   data: {
//     name,
//     username,
//     email,
//     token
//   },
//   metadata: {
//     access_expires
//   }
// }
AuthRouter.use('/login', CheckUserAgent, LoginRouter);

// POST /auth/regist
// header {User-Agent}
// body {name, username, email, password}
// response {
//   status,
//   data: {
//     name,
//     username,
//     email,
//     token
//   },
//   metadata: {
//     access_expires
//   }
// }
AuthRouter.post('/regist', registLimiter, CheckUserAgent, AuthValidator.Regist, AuthController.regist);

// GET /auth/refresh
// header {User-Agent}
// cookies {refreshToken}
// response {
//   status,
//   data: {
//     token
//   },
//   metadata: {
//     access_expires
//   }
// }
AuthRouter.get('/refresh', CheckUserAgent, AuthController.refreshAcessToken);

// POST /auth/redirect/{shortId}
// body {password}
AuthRouter.post('/redirect/:shortId', CommonValidator.Password, AuthController.redirectPermission);

export default AuthRouter;