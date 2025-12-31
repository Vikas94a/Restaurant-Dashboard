import { onCall } from 'firebase-functions/v2/https';
import { postTextToFacebook, postImageToFacebook } from './facebook.service';
import { facebookSystemUserToken, facebookPageId } from '../utils/env';
import type { PostTextRequest, PostImageRequest } from './facebook.types';

export const postTextToFacebookFunction = onCall(
  {
    region: 'europe-west1',
    secrets: [facebookSystemUserToken, facebookPageId],
  },
  async (request) => {
    const data = request.data as PostTextRequest;

    if (!data || typeof data.message !== 'string') {
      throw new Error('Invalid request: message is required');
    }

    const postId = await postTextToFacebook(data.message);

    return { id: postId };
  }
);

export const postImageToFacebookFunction = onCall(
  {
    region: 'europe-west1',
    secrets: [facebookSystemUserToken, facebookPageId],
  },
  async (request) => {
    const data = request.data as PostImageRequest;

    if (!data || typeof data.imageUrl !== 'string') {
      throw new Error('Invalid request: imageUrl is required');
    }

    const postId = await postImageToFacebook(data.imageUrl, data.caption || '');

    return { id: postId };
  }
);

