import { onRequest } from 'firebase-functions/v2/https';
import * as cors from 'cors';
import { postTextToFacebook, postImageToFacebook } from './facebook.service';
import { facebookSystemUserToken, facebookPageId } from '../utils/env';
import type { PostTextRequest, PostImageRequest } from './facebook.types';

// Configure CORS middleware
const corsHandler = cors({
  origin: '*', // Allow all origins (or specify 'http://localhost:3000' for dev)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});

// Helper function to run CORS middleware
const runCors = (req: any, res: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const postTextToFacebookFunction = onRequest(
  {
    region: 'europe-west1',
    secrets: [facebookSystemUserToken, facebookPageId],
  },
  async (req, res) => {
    // Handle CORS preflight
    await runCors(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const data = req.body as PostTextRequest;

      if (!data || typeof data.message !== 'string') {
        res.status(400).json({ error: 'Invalid request: message is required' });
        return;
      }

      const postId = await postTextToFacebook(data.message);

      res.status(200).json({ id: postId });
    } catch (error: any) {
      console.error('Error in postTextToFacebookFunction:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
);

export const postImageToFacebookFunction = onRequest(
  {
    region: 'europe-west1',
    secrets: [facebookSystemUserToken, facebookPageId],
  },
  async (req, res) => {
    // Handle CORS preflight
    await runCors(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const data = req.body as PostImageRequest;

      if (!data || typeof data.imageUrl !== 'string') {
        res.status(400).json({ error: 'Invalid request: imageUrl is required' });
        return;
      }

      const postId = await postImageToFacebook(data.imageUrl, data.caption || '');

      res.status(200).json({ id: postId });
    } catch (error: any) {
      console.error('Error in postImageToFacebookFunction:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
);

