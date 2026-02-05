import type {
  Account,
  ChangePasswordRequest,
  SuccessResponse,
  UpdateAccountRequest,
} from '@/interfaces';
import api, { createConfig, TIMEOUT } from './api';

export const fetchUser = async (username: string) => {
  return await api.get<SuccessResponse<Omit<Account, 'email'>>>(
    `/who/${username}`,
  );
};

export const fetchAccount = async () => {
  return await api.get<SuccessResponse<Account>>(
    '/user',
    createConfig({ requireAuth: true }),
  );
};

export const updateAccount = async (updateData: UpdateAccountRequest) => {
  return await api.put(
    '/user/update',
    updateData,
    createConfig({ requireAuth: true }),
  );
};

export const changePassword = async (
  changePasswordData: ChangePasswordRequest,
) => {
  return await api.put(
    '/user/changepassword',
    changePasswordData,
    createConfig({ requireAuth: true }),
  );
};

export const deleteAccount = async (password: string) => {
  return await api.delete(
    '/user/remove',
    createConfig({
      requireAuth: true,
      data: {
        // since there's no place for data in delete's args, so we put it in config
        password: password,
      },
    }),
  );
};

export const logout = async () => {
  return await api.post(
    '/user/logout',
    undefined,
    createConfig({ requireAuth: true }),
  );
};

export const logoutEverywhere = async () => {
  return await api.post(
    '/user/logoutall',
    undefined,
    createConfig({ requireAuth: true }),
  );
};
