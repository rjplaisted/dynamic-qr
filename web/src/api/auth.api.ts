import type {
  SuccessResponse,
  DataAuth,
  MetaAuth,
  LoginEmailRequest,
  LoginUsernameRequest,
} from '@/interfaces';
import api, { createConfig, TIMEOUT } from './api';

export const loginEmail = async (loginEmailData: LoginEmailRequest) => {
  return await api.post<SuccessResponse<DataAuth, MetaAuth>>(
    '/auth/login/email',
    loginEmailData,
    createConfig(),
  );
};

export const loginUsername = async (
  loginUsernameData: LoginUsernameRequest,
) => {
  return await api.post<SuccessResponse<DataAuth, MetaAuth>>(
    '/auth/login/username',
    loginUsernameData,
    createConfig(),
  );
};

export const refreshToken = async () => {
  return await api.get<SuccessResponse<Pick<DataAuth, 'token'>, MetaAuth>>(
    '/auth/refresh',
    createConfig(),
  );
};
