import type {
  Link,
  LinkRequest,
  MetaLink,
  SuccessResponse,
  UpdateLinkRequest,
} from '@/interfaces';
import api, { createConfig, TIMEOUT } from './api';

export const createLink = async (createData: LinkRequest) => {
  return await api.post<SuccessResponse<Link>>(
    '/url/new',
    createData,
    createConfig({ requireAuth: true }),
  );
};

export const fetchLink = async (linkId: string) => {
  return await api.get<SuccessResponse<Link>>(
    `/url/one/${linkId}`,
    createConfig({ requireAuth: true }),
  );
};

export const fetchLinks = async () => {
  return await api.get<SuccessResponse<Link[], MetaLink>>(
    '/url/all',
    createConfig({ requireAuth: true }),
  );
};

export const updateLink = async (
  linkId: string,
  updateData: UpdateLinkRequest,
) => {
  return await api.put(
    `/url/update/${linkId}`,
    updateData,
    createConfig({ requireAuth: true }),
  );
};

export const deleteLink = async (linkId: string) => {
  return await api.delete(
    `/url/remove/${linkId}`,
    createConfig({ requireAuth: true }),
  );
};

export const downloadLinkQrSvg = async (linkId: string) => {
  return await api.get(`/url/qr/${linkId}/svg`, {
    ...createConfig({ requireAuth: true }),
    responseType: 'blob',
  });
};

export const downloadLinkQrPng = async (linkId: string) => {
  return await api.get(`/url/qr/${linkId}/png`, {
    ...createConfig({ requireAuth: true }),
    responseType: 'blob',
  });
};
