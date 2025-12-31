import { functions, httpsCallable } from '@/lib/firebase';

interface PostTextRequest {
  message: string;
}

interface PostImageRequest {
  imageUrl: string;
  caption?: string;
}

interface PostResponse {
  id: string;
}

/**
 * Service for posting content to Facebook
 * Calls Firebase Callable Functions directly
 */
export class FacebookPostService {
  /**
   * Post text content to Facebook
   */
  static async postText(message: string): Promise<string> {
    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    const postTextToFacebook = httpsCallable<PostTextRequest, PostResponse>(
      functions,
      'postTextToFacebookFunction'
    );

    try {
      const result = await postTextToFacebook({ message });
      return result.data.id;
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      throw new Error(error.message || 'Failed to post to Facebook');
    }
  }

  /**
   * Post an image with caption to Facebook
   */
  static async postImage(imageUrl: string, caption?: string): Promise<string> {
    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    const postImageToFacebook = httpsCallable<PostImageRequest, PostResponse>(
      functions,
      'postImageToFacebookFunction'
    );

    try {
      const result = await postImageToFacebook({ 
        imageUrl, 
        caption: caption || '' 
      });
      return result.data.id;
    } catch (error: any) {
      console.error('Error posting image to Facebook:', error);
      throw new Error(error.message || 'Failed to post image to Facebook');
    }
  }

  /**
   * Post a complete marketing post (text + hashtags + CTA) to Facebook
   */
  static async postMarketingPost(post: {
    content: string;
    hashtags?: string[];
    callToAction?: string;
    imageUrl?: string;
  }): Promise<string> {
    // Combine content, hashtags, and CTA into a single message
    let message = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      message += '\n\n' + post.hashtags.join(' ');
    }
    
    if (post.callToAction) {
      message += '\n\n' + post.callToAction;
    }

    // If there's an image, post with image, otherwise post text only
    if (post.imageUrl) {
      return await this.postImage(post.imageUrl, message);
    } else {
      return await this.postText(message);
    }
  }
}

