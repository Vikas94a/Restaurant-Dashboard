"use client";

import { useState, useEffect, useCallback } from "react";
import { AIPostsService } from '@/services/aiPostsService';
import { FeedbackProcessor } from '@/services/feedbackProcessor';
import type { WeatherDay } from "../weatherData";
import type { CityEvent } from "../../events";

export interface MarketingPost {
    id: string;
    title: string;
    content: string;
    type: 'best-seller' | 'promotion' | 'new-item' | 'seasonal' | 'event-based' | 'weather-based' | 'auto-generated';
    targetItems: string[];
    suggestedPlatforms: string[];
    estimatedReach: string;
    callToAction: string;
    hashtags: string[];
    postingTime: string;
    paidPromotion: boolean;
    budgetRecommendation?: string;
    day?: string;
    imageRecommendations?: {
        whatToPhotograph: string;
        photoTips: string[];
        chatgptPrompt: string;
        imageDescription: string;
    };
    feedback?: 'helpful' | 'not_helpful';
    detailedFeedback?: {
        engagement?: 'high' | 'medium' | 'low';
        salesImpact?: 'positive' | 'neutral' | 'negative';
        contentQuality?: 'excellent' | 'good' | 'poor';
        timing?: 'perfect' | 'good' | 'poor';
        notes?: string;
    };
    scheduledDate?: string;
}

export interface RestaurantDetails {
    restaurantId?: string;
    ownerId?: string;
    city: string;
    zipCode: string;
    streetName: string;
    phoneNumber: string;
    restaurantType: string;
    name: string;
    openingHours: Array<{
        day: string;
        open: string;
        close: string;
        closed: boolean;
    }>;
    logoUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export function useAIPostGenerator(params: {
    topSellingItems: any[];
    weatherData: WeatherDay[];
    cityEvents: CityEvent[];
    restaurantName: string;
    restaurantType: string;
    city: string;
    restaurantDetails?: RestaurantDetails;
    onPostGenerated: (post: MarketingPost) => void;
}) {
    const {
        topSellingItems,
        weatherData,
        cityEvents,
        restaurantName,
        restaurantType,
        city,
        restaurantDetails,
        onPostGenerated,
    } = params;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<MarketingPost[]>([]);
    const [upcomingPosts, setUpcomingPosts] = useState<MarketingPost[]>([]);
    const [needsFeedbackPosts, setNeedsFeedbackPosts] = useState<MarketingPost[]>([]);
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [processingFeedback, setProcessingFeedback] = useState<Set<string>>(new Set());

    const generateAIInsights = useCallback(async (upcoming: MarketingPost[], needsFeedback: MarketingPost[]): Promise<string[]> => {
        const insights: string[] = [];
        const allPosts = [...upcoming, ...needsFeedback];
        if (allPosts.length === 0) return insights;

        if (needsFeedback.length > 0) {
            const feedbackProvided = needsFeedback.filter(p => p.feedback);
            insights.push(`📝 Feedback Progress: ${feedbackProvided.length}/${needsFeedback.length} posts have received feedback. ${needsFeedback.length - feedbackProvided.length} still need feedback.`);
        }

        const helpfulPosts = allPosts.filter(p => p.feedback === 'helpful');
        const notHelpfulPosts = allPosts.filter(p => p.feedback === 'not_helpful');
        if (helpfulPosts.length > notHelpfulPosts.length && helpfulPosts.length > 0) {
            insights.push("✅ Your customers respond well to AI-generated posts. Keep providing feedback to improve quality.");
        } else if (notHelpfulPosts.length > helpfulPosts.length && notHelpfulPosts.length > 0) {
            insights.push("⚠️ Recent posts haven't performed well. Consider adjusting your feedback to help AI learn.");
        }

        const typeCounts = allPosts.reduce((acc, post) => {
            acc[post.type] = (acc[post.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostCommonType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
        if (mostCommonType) {
            insights.push(`📊 Most generated post type: ${mostCommonType[0].replace('-', ' ')} (${mostCommonType[1]} posts)`);
        }

        const weatherPosts = allPosts.filter(p => p.type === 'weather-based');
        if (weatherPosts.length > 0) {
            insights.push("🌤️ Weather-based posts are being generated to match local conditions across your 3-day weekly schedule.");
        }

        const paidPosts = allPosts.filter(p => p.paidPromotion);
        const totalPosts = allPosts.length;
        if (totalPosts > 0) {
            const paidPercentage = Math.round((paidPosts.length / totalPosts) * 100);
            if (paidPercentage > 60) {
                insights.push("💰 High paid promotion usage detected. AI is recommending paid ads strategically for maximum value.");
            } else if (paidPercentage < 30) {
                insights.push("💡 Conservative paid promotion approach. AI is focusing on organic reach when sufficient.");
            } else {
                insights.push("⚖️ Balanced paid promotion strategy. AI recommends paid ads only when they create real value.");
            }
        }

        try {
            const restaurantId = restaurantDetails?.restaurantId;
            if (restaurantId) {
                const learningInsights = await FeedbackProcessor.generateLearningInsights(restaurantId);
                insights.push(...learningInsights);
            }
        } catch {
            insights.push('Learning insights will be available once feedback is processed.');
        }

        return insights;
    }, [restaurantDetails?.restaurantId]);

    const refreshPosts = useCallback(async () => {
        const restaurantId = restaurantDetails?.restaurantId;
        if (!restaurantId) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const validUpcoming = upcomingPosts.filter(post => post.scheduledDate && post.scheduledDate >= today);
            if (validUpcoming.length !== upcomingPosts.length) setUpcomingPosts(validUpcoming);
            const pending = await AIPostsService.getPostsNeedingFeedback(restaurantId) as unknown as MarketingPost[] | null;
            setNeedsFeedbackPosts((pending || []) as MarketingPost[]);
            const insights = await generateAIInsights(upcomingPosts, (pending || []) as MarketingPost[]);
            setAiInsights(insights);
        } catch (e) {
            console.error('Failed to refresh posts:', e);
        }
    }, [restaurantDetails?.restaurantId, upcomingPosts, generateAIInsights]);

    useEffect(() => {
        const loadExistingPosts = async () => {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;
            try {
                const upcoming = await AIPostsService.getUpcomingPosts(restaurantId) as unknown as MarketingPost[] | null;
                if (upcoming && upcoming.length > 0) setUpcomingPosts(upcoming as MarketingPost[]);
                const pending = await AIPostsService.getPostsNeedingFeedback(restaurantId) as unknown as MarketingPost[] | null;
                if (pending && pending.length > 0) setNeedsFeedbackPosts(pending as MarketingPost[]);
                const insights = await generateAIInsights((upcoming || []) as MarketingPost[], (pending || []) as MarketingPost[]);
                setAiInsights(insights);
            } catch (e) {
                console.error('Failed to load existing posts:', e);
            }
        };
        loadExistingPosts();
    }, [restaurantDetails?.restaurantId, generateAIInsights]);

    useEffect(() => {
        const interval = setInterval(refreshPosts, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshPosts]);

    const generatePosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const restaurantId = restaurantDetails?.restaurantId;
            let previousPosts: MarketingPost[] | null = null;
            if (restaurantId) {
                try {
                    previousPosts = await AIPostsService.getLatestPosts(restaurantId) as unknown as MarketingPost[] | null;
                } catch (e) {}
            }
            const response = await fetch('/api/generate-marketing-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topSellingItems,
                    weatherData,
                    cityEvents,
                    restaurantName,
                    restaurantType,
                    city,
                    restaurantDetails,
                    previousPosts
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate posts');
            }
            const data = await response.json();
            if (data.success && data.posts) {
                setGeneratedPosts(data.posts);
                data.posts.forEach((post: MarketingPost) => onPostGenerated(post));
                if (restaurantId) {
                    try { await AIPostsService.savePosts(restaurantId, data.posts); } catch {}
                }
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate posts");
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackChange = async (postId: string, value: 'helpful' | 'not_helpful') => {
        setGeneratedPosts((prev) => prev.map((p) => p.id === postId ? { ...p, feedback: value } : p));
        setUpcomingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, feedback: value } : p));
        setNeedsFeedbackPosts((prev) => prev.map((p) => p.id === postId ? { ...p, feedback: value } : p));
        try {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;
            const today = new Date().toISOString().split('T')[0];
            await AIPostsService.updatePostFeedback(restaurantId, today, postId, value);
            const allPosts = [...generatedPosts, ...upcomingPosts, ...needsFeedbackPosts];
            const post = allPosts.find(p => p.id === postId);
            if (post) {
                const feedbackData = {
                    postId: post.id,
                    postTitle: post.title,
                    postContent: post.content,
                    postType: post.type,
                    feedback: value,
                    detailedFeedback: post.detailedFeedback || {},
                    restaurantId: restaurantId,
                    restaurantName: restaurantName,
                    restaurantType: restaurantType
                };
                setProcessingFeedback(prev => new Set(prev).add(postId));
                FeedbackProcessor.processFeedback(feedbackData).then(() => {
                    setTimeout(refreshPosts, 2000);
                }).catch(() => {}).finally(() => {
                    setProcessingFeedback(prev => {
                        const next = new Set(prev);
                        next.delete(postId);
                        return next;
                    });
                });
            }
            setTimeout(refreshPosts, 1000);
        } catch (e) {
            console.error('Failed to update feedback:', e);
        }
    };

    const handleDetailedFeedbackChange = async (postId: string, category: string, value: string) => {
        const updatePost = (posts: MarketingPost[]) => posts.map((p) => p.id === postId ? { ...p, detailedFeedback: { ...p.detailedFeedback, [category]: value } } : p);
        setGeneratedPosts(updatePost);
        setUpcomingPosts(updatePost);
        setNeedsFeedbackPosts(updatePost);
        try {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;
            const today = new Date().toISOString().split('T')[0];
            await AIPostsService.updatePostDetailedFeedback(restaurantId, today, postId, category, value);
            const allPosts = [...generatedPosts, ...upcomingPosts, ...needsFeedbackPosts];
            const post = allPosts.find(p => p.id === postId);
            if (post) {
                const updatedPost = { ...post, detailedFeedback: { ...post.detailedFeedback, [category]: value } };
                const hasBasicFeedback = updatedPost.feedback;
                const hasDetailedFeedback = updatedPost.detailedFeedback?.engagement && updatedPost.detailedFeedback?.salesImpact && updatedPost.detailedFeedback?.contentQuality && updatedPost.detailedFeedback?.timing;
                if (hasBasicFeedback && hasDetailedFeedback) {
                    const feedbackData = {
                        postId: updatedPost.id,
                        postTitle: updatedPost.title,
                        postContent: updatedPost.content,
                        postType: updatedPost.type,
                        feedback: updatedPost.feedback,
                        detailedFeedback: updatedPost.detailedFeedback,
                        restaurantId: restaurantId,
                        restaurantName: restaurantName,
                        restaurantType: restaurantType
                    };
                    setProcessingFeedback(prev => new Set(prev).add(postId));
                    FeedbackProcessor.processFeedback(feedbackData).then(() => {
                        setTimeout(refreshPosts, 2000);
                    }).catch(() => {}).finally(() => {
                        setProcessingFeedback(prev => {
                            const next = new Set(prev);
                            next.delete(postId);
                            return next;
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Failed to update detailed feedback:', e);
        }
    };

    return {
        loading,
        error,
        generatedPosts,
        upcomingPosts,
        needsFeedbackPosts,
        aiInsights,
        processingFeedback,
        generatePosts,
        handleFeedbackChange,
        handleDetailedFeedbackChange,
    };
}


