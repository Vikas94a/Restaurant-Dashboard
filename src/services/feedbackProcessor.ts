import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeedbackSummary {
    overallRating: 'positive' | 'negative' | 'mixed';
    keyInsights: string[];
    improvements: string[];
    strengths: string[];
    recommendations: string[];
    learningPoints: string[];
}

export interface ProcessedFeedback {
    id: string;
    postId: string;
    restaurantId: string;
    originalFeedback: any;
    summary: FeedbackSummary;
    createdAt: Date;
    processedAt: Date;
}

export class FeedbackProcessor {
    /**
     * Process feedback by sending it to AI for summarization
     */
    static async processFeedback(feedbackData: any): Promise<FeedbackSummary | null> {
        try {
            const response = await fetch('/api/process-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.summary;
        } catch (error) {
            console.error('Error processing feedback:', error);
            return null;
        }
    }

    /**
     * Save processed feedback summary to database
     */
    static async saveProcessedFeedback(
        restaurantId: string,
        processedFeedback: ProcessedFeedback
    ): Promise<void> {
        try {
            const feedbackRef = collection(db, 'restaurants', restaurantId, 'feedbackSummaries');
            const docRef = doc(feedbackRef, processedFeedback.id);
            
            await setDoc(docRef, {
                ...processedFeedback,
                createdAt: processedFeedback.createdAt,
                processedAt: processedFeedback.processedAt
            });
        } catch (error) {
            console.error('Error saving processed feedback:', error);
            throw error;
        }
    }

    /**
     * Get recent feedback summaries for a restaurant
     */
    static async getRecentFeedbackSummaries(
        restaurantId: string,
        limitCount: number = 10
    ): Promise<ProcessedFeedback[]> {
        try {
            const feedbackRef = collection(db, 'restaurants', restaurantId, 'feedbackSummaries');
            const q = query(
                feedbackRef,
                orderBy('processedAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const summaries: ProcessedFeedback[] = [];
            
            querySnapshot.forEach((doc) => {
                summaries.push(doc.data() as ProcessedFeedback);
            });
            
            return summaries;
        } catch (error) {
            console.error('Error fetching feedback summaries:', error);
            // Return empty array for permission errors or other issues
            // This prevents the app from breaking when feedback summaries aren't available
            return [];
        }
    }

    /**
     * Generate AI learning insights from all feedback summaries
     */
    static async generateLearningInsights(restaurantId: string): Promise<string[]> {
        try {
            const summaries = await this.getRecentFeedbackSummaries(restaurantId, 20);
            
            if (summaries.length === 0) {
                return ['No feedback data available yet. Start providing feedback to help AI learn your preferences.'];
            }

            // Analyze patterns in feedback summaries
            const insights: string[] = [];
            
            // Count overall ratings
            const positiveCount = summaries.filter(s => s.summary.overallRating === 'positive').length;
            const negativeCount = summaries.filter(s => s.summary.overallRating === 'negative').length;
            const mixedCount = summaries.filter(s => s.summary.overallRating === 'mixed').length;
            
            // Overall performance insight
            if (positiveCount > negativeCount) {
                insights.push(`📈 Overall Performance: ${positiveCount} positive vs ${negativeCount} negative feedback. AI is learning your preferences well.`);
            } else if (negativeCount > positiveCount) {
                insights.push(`📉 Overall Performance: ${negativeCount} negative vs ${positiveCount} positive feedback. Consider providing more specific feedback to help AI improve.`);
            } else {
                insights.push(`📊 Overall Performance: Mixed results with ${positiveCount} positive, ${negativeCount} negative, and ${mixedCount} mixed feedback.`);
            }

            // Extract common improvements
            const allImprovements = summaries.flatMap(s => s.summary.improvements);
            const improvementCounts = allImprovements.reduce((acc, improvement) => {
                acc[improvement] = (acc[improvement] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const topImprovements = Object.entries(improvementCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
                
            if (topImprovements.length > 0) {
                insights.push(`🔧 Common Improvements Needed: ${topImprovements.map(([improvement, count]) => `${improvement} (${count}x)`).join(', ')}`);
            }

            // Extract common strengths
            const allStrengths = summaries.flatMap(s => s.summary.strengths);
            const strengthCounts = allStrengths.reduce((acc, strength) => {
                acc[strength] = (acc[strength] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const topStrengths = Object.entries(strengthCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
                
            if (topStrengths.length > 0) {
                insights.push(`✅ What's Working Well: ${topStrengths.map(([strength, count]) => `${strength} (${count}x)`).join(', ')}`);
            }

            // Extract common recommendations
            const allRecommendations = summaries.flatMap(s => s.summary.recommendations);
            const recommendationCounts = allRecommendations.reduce((acc, recommendation) => {
                acc[recommendation] = (acc[recommendation] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const topRecommendations = Object.entries(recommendationCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
                
            if (topRecommendations.length > 0) {
                insights.push(`💡 Key Recommendations: ${topRecommendations.map(([recommendation, count]) => `${recommendation} (${count}x)`).join(', ')}`);
            }

            // Learning progress insight
            const totalFeedback = summaries.length;
            insights.push(`🧠 AI Learning Progress: ${totalFeedback} feedback summaries processed. The AI is continuously learning from your input.`);

            return insights;
        } catch (error) {
            console.error('Error generating learning insights:', error);
            // Return a friendly message instead of breaking the app
            return ['Learning insights will be available once feedback data is processed.'];
        }
    }

    /**
     * Get formatted feedback history for AI post generation
     */
    static async getFeedbackHistoryForAI(restaurantId: string): Promise<string> {
        try {
            const summaries = await this.getRecentFeedbackSummaries(restaurantId, 15);
            
            if (summaries.length === 0) {
                return 'No previous feedback available.';
            }

            let history = 'PREVIOUS FEEDBACK ANALYSIS:\n\n';
            
            summaries.forEach((summary, index) => {
                history += `Post ${index + 1} (${summary.summary.overallRating}):\n`;
                history += `- Key Insights: ${summary.summary.keyInsights.join(', ')}\n`;
                
                if (summary.summary.improvements.length > 0) {
                    history += `- Improvements Needed: ${summary.summary.improvements.join(', ')}\n`;
                }
                
                if (summary.summary.strengths.length > 0) {
                    history += `- Strengths: ${summary.summary.strengths.join(', ')}\n`;
                }
                
                if (summary.summary.recommendations.length > 0) {
                    history += `- Recommendations: ${summary.summary.recommendations.join(', ')}\n`;
                }
                
                history += '\n';
            });

            // Add overall patterns
            const positiveCount = summaries.filter(s => s.summary.overallRating === 'positive').length;
            const negativeCount = summaries.filter(s => s.summary.overallRating === 'negative').length;
            
            history += `OVERALL PATTERNS:\n`;
            history += `- Positive feedback: ${positiveCount}/${summaries.length} posts\n`;
            history += `- Negative feedback: ${negativeCount}/${summaries.length} posts\n`;
            
            return history;
        } catch (error) {
            console.error('Error getting feedback history:', error);
            // Return empty string to avoid breaking AI post generation
            return 'No previous feedback available.';
        }
    }
}
