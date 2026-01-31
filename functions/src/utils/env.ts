import { defineSecret } from 'firebase-functions/params';

export const facebookSystemUserToken = defineSecret('FACEBOOK_SYSTEM_USER_TOKEN');
export const facebookPageId = defineSecret('FACEBOOK_PAGE_ID');

export function getFacebookSystemUserToken(): string {
  const token = facebookSystemUserToken.value();
  if (!token) {
    throw new Error('FACEBOOK_SYSTEM_USER_TOKEN is not set');
  }
  return token;
}

export function getFacebookPageId(): string {
  const pageId = facebookPageId.value();
  if (!pageId) {
    throw new Error('FACEBOOK_PAGE_ID is not set');
  }
  return pageId;
}


