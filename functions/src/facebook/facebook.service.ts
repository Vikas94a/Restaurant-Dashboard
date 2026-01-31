import { getFacebookPageId, getFacebookSystemUserToken } from '../utils/env';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export async function postTextToFacebook(message: string): Promise<string> {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('message is required and must be a non-empty string');
  }

  const pageId = getFacebookPageId();
  const accessToken = getFacebookSystemUserToken();
  const url = `${GRAPH_API_BASE}/${pageId}/feed`;

  const formData = new URLSearchParams();
  formData.append('message', message);
  formData.append('access_token', accessToken);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Facebook API error: ${response.status} ${response.statusText}`
    );
  }

  return data.id;
}

export async function postImageToFacebook(
  imageUrl: string,
  caption: string = ''
): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
    throw new Error('imageUrl is required and must be a non-empty string');
  }

  const pageId = getFacebookPageId();
  const accessToken = getFacebookSystemUserToken();
  const url = `${GRAPH_API_BASE}/${pageId}/photos`;

  const formData = new URLSearchParams();
  formData.append('url', imageUrl);
  formData.append('caption', caption);
  formData.append('access_token', accessToken);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Facebook API error: ${response.status} ${response.statusText}`
    );
  }

  return data.id;
}


