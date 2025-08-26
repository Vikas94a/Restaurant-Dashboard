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
     * Find the aiPosts document that contains a given postId within recent documents
     */
    private static async findDocumentContainingPost(
        restaurantId: string,
        postId: string,
        lookbackDocuments: number = 30
    ): Promise<{ docId: string; posts: MarketingPost[] } | null> {
        try {
            const aiPostsRef = collection(db, 'restaurants', restaurantId, 'aiPosts');
            const q = query(
                aiPostsRef,
                orderBy('date', 'desc'),
                limit(lookbackDocuments)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data() as StoredAIPost;
                const posts = data?.posts || [];
                if (posts.some((p) => p.id === postId)) {
                    return { docId: docSnap.id, posts };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }
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
     * Get any upcoming posts from today onward (returns flattened list)
     */
    static async getUpcomingPosts(restaurantId: string): Promise<MarketingPost[] | null> {
        try {
            const today = new Date();
            const ymd = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

            const aiPostsRef = collection(db, 'restaurants', restaurantId, 'aiPosts');
            // Look back over recent documents and filter by each post's scheduledDate
            const q = query(
                aiPostsRef,
                orderBy('date', 'desc'),
                limit(14)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            const upcoming: MarketingPost[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data() as StoredAIPost;
                (data.posts || []).forEach((p) => {
                    if (p.scheduledDate && p.scheduledDate >= ymd) {
                        upcoming.push(p);
                    }
                });
            });
            upcoming.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
            return upcoming;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get past posts that still need feedback (scheduledDate < today and no feedback)
     */
    static async getPostsNeedingFeedback(restaurantId: string): Promise<MarketingPost[] | null> {
        try {
            const today = new Date();
            const ymd = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
            const aiPostsRef = collection(db, 'restaurants', restaurantId, 'aiPosts');
            const q = query(
                aiPostsRef,
                orderBy('date', 'desc'),
                limit(14)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            const pending: MarketingPost[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data() as StoredAIPost;
                (data.posts || []).forEach((p) => {
                    if ((p.scheduledDate && p.scheduledDate < ymd) && !p.feedback) {
                        pending.push(p);
                    }
                });
            });
            pending.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
            return pending;
        } catch (e) {
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

    /**
     * Update feedback for a specific post within the date's posts array
     */
    static async updatePostFeedback(
        restaurantId: string,
        date: string,
        postId: string,
        feedback: 'helpful' | 'not_helpful'
    ): Promise<void> {
        try {
            if (!restaurantId) {
                throw new Error('restaurantId is required');
            }
            if (!date) {
                throw new Error('date is required (YYYY-MM-DD)');
            }
            if (!postId) {
                throw new Error('postId is required');
            }

            // Try the specified date first
            let targetDocId = date;
            let dataPosts: MarketingPost[] | null = null;

            const primaryDocRef = doc(db, 'restaurants', restaurantId, 'aiPosts', date);
            const primarySnapshot = await getDoc(primaryDocRef);
            if (primarySnapshot.exists()) {
                const data = primarySnapshot.data() as StoredAIPost;
                dataPosts = data.posts || [];
            } else {
                // Fallback: search recent documents to locate the post by id
                const found = await this.findDocumentContainingPost(restaurantId, postId);
                if (!found) {
                    throw new Error('AI posts document not found for the specified date or containing the post');
                }
                targetDocId = found.docId;
                dataPosts = found.posts;
            }

            const updatedPosts = (dataPosts || []).map((p) =>
                p.id === postId ? { ...p, feedback } : p
            );

            await setDoc(
                doc(db, 'restaurants', restaurantId, 'aiPosts', targetDocId),
                {
                    posts: updatedPosts,
                    updatedAt: new Date()
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Error updating AI post feedback:', error);
            throw error;
        }
    }

    /**
     * Update detailed feedback for a specific post within the date's posts array
     */
    static async updatePostDetailedFeedback(
        restaurantId: string,
        date: string,
        postId: string,
        category: string,
        value: string
    ): Promise<void> {
        try {
            if (!restaurantId) {
                throw new Error('restaurantId is required');
            }
            if (!date) {
                throw new Error('date is required (YYYY-MM-DD)');
            }
            if (!postId) {
                throw new Error('postId is required');
            }
            if (!category) {
                throw new Error('category is required');
            }

            // Try the specified date first
            let targetDocId = date;
            let dataPosts: MarketingPost[] | null = null;

            const primaryDocRef = doc(db, 'restaurants', restaurantId, 'aiPosts', date);
            const primarySnapshot = await getDoc(primaryDocRef);
            if (primarySnapshot.exists()) {
                const data = primarySnapshot.data() as StoredAIPost;
                dataPosts = data.posts || [];
            } else {
                // Fallback: search recent documents to locate the post by id
                const found = await this.findDocumentContainingPost(restaurantId, postId);
                if (!found) {
                    throw new Error('AI posts document not found for the specified date or containing the post');
                }
                targetDocId = found.docId;
                dataPosts = found.posts;
            }

            const updatedPosts = (dataPosts || []).map((p) => {
                if (p.id === postId) {
                    return {
                        ...p,
                        detailedFeedback: {
                            ...p.detailedFeedback,
                            [category]: value
                        }
                    };
                }
                return p;
            });

            await setDoc(
                doc(db, 'restaurants', restaurantId, 'aiPosts', targetDocId),
                {
                    posts: updatedPosts,
                    updatedAt: new Date()
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Error updating AI post detailed feedback:', error);
            throw error;
        }
    }
} 