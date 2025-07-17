import { collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MarketingPost } from '@/components/dashboardcomponent/AIInsight/AIPostGenerator';

export interface StoredAIPost {
    id: string;
    date: string; // YYYY-MM-DD format
    posts: MarketingPost[];
    createdAt: Date;
    updatedAt: Date;
}

export class AIPostsService {
    /**
     * Test Firestore connection
     */
    static async testConnection(): Promise<boolean> {
        try {
            // First check if Firebase is properly initialized
            if (!db) {
                return false;
            }

            // Check if required environment variables are set
            const requiredEnvVars = [
                'NEXT_PUBLIC_FIREBASE_API_KEY',
                'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
            ];
            
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            if (missingVars.length > 0) {
                return false;
            }

            // Try to write and read a test document
            const testDoc = doc(db, 'test', 'connection-test');
            const testData = { 
                test: true, 
                timestamp: new Date(),
                environment: process.env.NODE_ENV
            };

            await setDoc(testDoc, testData);
            
            // Verify the write by reading it back
            const readResult = await getDoc(testDoc);
            if (!readResult.exists()) {
                return false;
            }

            // Clean up the test document
            await deleteDoc(testDoc);
            
            return true;
        } catch (error) {
            console.error('Firestore connection test failed:', error);
            return false;
        }
    }

    /**
     * Save AI-generated posts for a specific restaurant and date
     */
    static async savePosts(restaurantId: string, posts: MarketingPost[]): Promise<void> {
        try {

            if (!restaurantId) {
                throw new Error('restaurantId is required');
            }
            
            if (!posts || posts.length === 0) {
                throw new Error('posts array is required and cannot be empty');
            }

            // Validate each post has required fields
            posts.forEach((post, index) => {
                if (!post.id || !post.title || !post.content) {
                    throw new Error(`Post at index ${index} is missing required fields`);
                }
            });

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const postData: StoredAIPost = {
                id: today, // Use date as the document ID
                date: today,
                posts,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('Preparing to save:', {
                restaurantId,
                postsCount: postData.posts.length,
                firstPostTitle: postData.posts[0]?.title
            });

            const docRef = doc(db, 'restaurants', restaurantId, 'aiPosts', postData.id);
            // First check if document exists
            const existingDoc = await getDoc(docRef);
            console.log('Existing document check:', {
                exists: existingDoc.exists(),
                data: existingDoc.exists() ? 'Document exists' : 'No existing document'
            });

            // Save the document
            await setDoc(docRef, {
                ...postData,
                createdAt: postData.createdAt,
                updatedAt: postData.updatedAt
            });
            
            // Verify save
            const savedDoc = await getDoc(docRef);
            console.log('Save verification:', {
                saved: savedDoc.exists(),
                savedData: savedDoc.exists() ? {
                    id: savedDoc.id,
                    postsCount: savedDoc.data()?.posts?.length,
                    date: savedDoc.data()?.date
                } : null
            });

        } catch (error) {
            console.error('Error saving AI posts:', error);
            throw error;
        }
    }

    /**
     * Get AI-generated posts for a specific restaurant and date
     */
    static async getPostsForDate(restaurantId: string, date?: string): Promise<MarketingPost[] | null> {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const postDoc = await getDoc(doc(db, 'restaurants', restaurantId, 'aiPosts', targetDate));
            
            if (postDoc.exists()) {
                const data = postDoc.data() as StoredAIPost;
                return data.posts;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if posts exist for today
     */
    static async hasPostsForToday(restaurantId: string): Promise<boolean> {
        try {
            const posts = await this.getPostsForDate(restaurantId);
            return posts !== null && posts.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the most recent AI posts for a restaurant
     */
    static async getLatestPosts(restaurantId: string): Promise<MarketingPost[] | null> {
        try {
            const aiPostsRef = collection(db, 'restaurants', restaurantId, 'aiPosts');
            const q = query(
                aiPostsRef,
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const latestDoc = querySnapshot.docs[0];
                const data = latestDoc.data() as StoredAIPost;
                return data.posts;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Delete posts for a specific date (hard delete)
     */
    static async deletePostsForDate(restaurantId: string, date: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'aiPosts', date));
        } catch (error) {
            console.error('Error deleting AI posts:', error);
            throw error;
        }
    }
} 