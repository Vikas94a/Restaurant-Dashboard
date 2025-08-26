"use client";

import { useState, useEffect, useCallback } from "react";
import { AIPostsService } from '@/services/aiPostsService';
import type { WeatherDay } from "./weatherData";
import type { CityEvent } from "../events";

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
    scheduledDate?: string; // YYYY-MM-DD for when to post
}

// Simplified data format matching getTopSellingItemsLast3Months
export interface SimplifiedMenuItem {
    name: string;
    sales: number;
}

export interface SimplifiedCategoryData {
    category: string;
    items: SimplifiedMenuItem[];
}

// Restaurant details interface
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

export interface AIPostGeneratorProps {
    topSellingItems: SimplifiedCategoryData[];
    weatherData: WeatherDay[];
    cityEvents: CityEvent[];
    restaurantName: string;
    restaurantType: string;
    city: string;
    restaurantDetails?: RestaurantDetails;
    onPostGenerated: (post: MarketingPost) => void;
}

export const AIPostGenerator: React.FC<AIPostGeneratorProps> = ({
    topSellingItems,
    weatherData,
    cityEvents,
    restaurantName,
    restaurantType,
    city,
    restaurantDetails,
    onPostGenerated
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<MarketingPost[]>([]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [upcomingPosts, setUpcomingPosts] = useState<MarketingPost[]>([]);
    const [needsFeedbackPosts, setNeedsFeedbackPosts] = useState<MarketingPost[]>([]);
    const [aiInsights, setAiInsights] = useState<string[]>([]);

    // Auto-refresh logic: check for expired posts and update state
    const refreshPosts = useCallback(async () => {
        const restaurantId = restaurantDetails?.restaurantId;
        if (!restaurantId) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Filter out expired posts
            const validUpcoming = upcomingPosts.filter(post => 
                post.scheduledDate && post.scheduledDate >= today
            );
            
            if (validUpcoming.length !== upcomingPosts.length) {
                setUpcomingPosts(validUpcoming);
            }

            // Update needs feedback posts
            const pending = await AIPostsService.getPostsNeedingFeedback(restaurantId);
            setNeedsFeedbackPosts(pending || []);

            // Generate AI insights based on feedback
            const insights = generateAIInsights(upcomingPosts, needsFeedbackPosts);
            setAiInsights(insights);

        } catch (error) {
            console.error('Failed to refresh posts:', error);
        }
    }, [restaurantDetails?.restaurantId, upcomingPosts, needsFeedbackPosts]);

    // Generate AI insights based on feedback patterns
    const generateAIInsights = (upcoming: MarketingPost[], needsFeedback: MarketingPost[]): string[] => {
        const insights: string[] = [];
        const allPosts = [...upcoming, ...needsFeedback];
        
        if (allPosts.length === 0) return insights;

        // Analyze feedback patterns
        const helpfulPosts = allPosts.filter(p => p.feedback === 'helpful');
        const notHelpfulPosts = allPosts.filter(p => p.feedback === 'not_helpful');
        
        if (helpfulPosts.length > notHelpfulPosts.length) {
            insights.push("✅ Your customers respond well to AI-generated posts. Keep providing feedback to improve quality.");
        } else if (notHelpfulPosts.length > helpfulPosts.length) {
            insights.push("⚠️ Recent posts haven't performed well. Consider adjusting your feedback to help AI learn.");
        }

        // Analyze post types
        const typeCounts = allPosts.reduce((acc, post) => {
            acc[post.type] = (acc[post.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostCommonType = Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostCommonType) {
            insights.push(`📊 Most generated post type: ${mostCommonType[0].replace('-', ' ')} (${mostCommonType[1]} posts)`);
        }

        // Weather-based insights
        const weatherPosts = allPosts.filter(p => p.type === 'weather-based');
        if (weatherPosts.length > 0) {
            insights.push("🌤️ Weather-based posts are being generated to match local conditions.");
        }

        return insights;
    };

    // Load existing posts on mount
    useEffect(() => {
        const loadExistingPosts = async () => {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;

            try {
                // Load upcoming posts
                const upcoming = await AIPostsService.getUpcomingPosts(restaurantId);
                if (upcoming && upcoming.length > 0) {
                    setUpcomingPosts(upcoming);
                }

                // Load posts needing feedback
                const pending = await AIPostsService.getPostsNeedingFeedback(restaurantId);
                if (pending && pending.length > 0) {
                    setNeedsFeedbackPosts(pending);
                }

                // Generate initial insights
                const insights = generateAIInsights(upcoming || [], pending || []);
                setAiInsights(insights);
            } catch (error) {
                console.error('Failed to load existing posts:', error);
            }
        };

        loadExistingPosts();
    }, [restaurantDetails?.restaurantId]);

    // Auto-refresh every hour
    useEffect(() => {
        const interval = setInterval(refreshPosts, 60 * 60 * 1000); // 1 hour
        return () => clearInterval(interval);
    }, [refreshPosts]);

    // Manual generation only - no auto-generation

    // Generate 2 days of posts automatically (first and third day)
    const generatePosts = async () => {
        setLoading(true);
        setError(null);

        try {
            const restaurantId = restaurantDetails?.restaurantId;
            let previousPosts: MarketingPost[] | null = null;
            if (restaurantId) {
                try {
                    previousPosts = await AIPostsService.getLatestPosts(restaurantId);
                } catch (e) {
                    console.warn('Failed to load previous AI posts:', e);
                }
            }

            // Structured input logs
            try {
                console.groupCollapsed('[AI-POST] Generate Request');
                console.log('Restaurant', { restaurantName, restaurantType, city });
                console.log('Sales categories', topSellingItems?.length || 0);
                console.log('Weather days', weatherData?.length || 0);
                console.log('City events', cityEvents?.length || 0);
                if (previousPosts) {
                    const feedbackSummary = previousPosts.reduce(
                        (acc, p) => {
                            if (p.feedback === 'helpful') acc.helpful += 1;
                            if (p.feedback === 'not_helpful') acc.notHelpful += 1;
                            return acc;
                        },
                        { helpful: 0, notHelpful: 0 }
                    );
                    console.log('Previous posts', previousPosts.length, feedbackSummary);
                    console.log('Recent titles', previousPosts.slice(0, 3).map(p => p.title));
                } else {
                    console.log('Previous posts', 0);
                }
                console.groupEnd();
            } catch {}

            const response = await fetch('/api/generate-marketing-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                // Call onPostGenerated for each post
                data.posts.forEach((post: MarketingPost) => {
                    onPostGenerated(post);
                });

                // Persist generated posts for today if restaurantId is available
                try {
                    if (restaurantId) {
                        await AIPostsService.savePosts(restaurantId, data.posts);
                    }
                } catch (persistError) {
                    console.error('Failed to save AI posts:', persistError);
                }

                // Structured output logs
                try {
                    console.groupCollapsed('[AI-POST] Generate Response');
                    console.log('Generated posts', data.posts.length);
                    console.log('Titles', data.posts.map((p: MarketingPost) => p.title));
                    if (data.debug) {
                        console.log('Input summary', data.debug.inputSummary);
                        console.log('Reasoning summary', data.debug.reasoningSummary);
                        console.log('OpenAI usage', data.debug.openai);
                    }
                    console.groupEnd();
                } catch {}

            } else {
                throw new Error('Invalid response from API');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate posts");
        } finally {
            setLoading(false);
        }
    };

    const regeneratePosts = () => {
        setGeneratedPosts([]);
        generatePosts();
    };

    const handleFeedbackChange = async (postId: string, value: 'helpful' | 'not_helpful') => {
        // Update UI optimistically
        setGeneratedPosts((prev) => prev.map((p) => p.id === postId ? { ...p, feedback: value } : p));
        setUpcomingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, feedback: value } : p));

        // Persist feedback
        try {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;
            const today = new Date().toISOString().split('T')[0];
            await AIPostsService.updatePostFeedback(restaurantId, today, postId, value);
            
            // Refresh insights after feedback
            setTimeout(refreshPosts, 1000);
        } catch (e) {
            console.error('Failed to update feedback:', e);
        }
    };

    const handleDetailedFeedbackChange = async (postId: string, category: string, value: string) => {
        // Update UI optimistically
        const updatePost = (posts: MarketingPost[]) => posts.map((p) => 
            p.id === postId 
                ? { 
                    ...p, 
                    detailedFeedback: { 
                        ...p.detailedFeedback, 
                        [category]: value 
                    } 
                } 
                : p
        );
        
        setGeneratedPosts(updatePost);
        setUpcomingPosts(updatePost);

        // Persist detailed feedback
        try {
            const restaurantId = restaurantDetails?.restaurantId;
            if (!restaurantId) return;
            const today = new Date().toISOString().split('T')[0];
            await AIPostsService.updatePostDetailedFeedback(restaurantId, today, postId, category, value);
        } catch (e) {
            console.error('Failed to update detailed feedback:', e);
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Insights Section */}
            {aiInsights.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        🤖 AI Insights
                    </h3>
                    <div className="space-y-2">
                        {aiInsights.map((insight, index) => (
                            <p key={index} className="text-sm text-blue-700">{insight}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Manual Generation Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">AI Marketing Post Generator</h3>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={generatePosts}
                            disabled={loading || (upcomingPosts && upcomingPosts.length > 0)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                        >
                            {loading ? 'Generating...' : 'Generate Posts'}
                        </button>
                    </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                    Generate 2 days of Facebook marketing posts based on weather, events, and sales data. 
                    Includes image recommendations and ChatGPT prompts for image enhancement.
                </p>

                {loading && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Generating your 2-day marketing plan with AI...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-600">
                        <p>Error: {error}</p>
                        {error.includes('OpenAI API key not configured') && (
                            <p className="text-sm mt-2">Please configure your OpenAI API key in the environment variables.</p>
                        )}
                    </div>
                )}

                {/* Upcoming posts block notice */}
                {upcomingPosts && upcomingPosts.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800">
                        <p className="font-semibold mb-1">AI posts already scheduled:</p>
                        <ul className="list-disc list-inside text-sm">
                            {upcomingPosts
                                .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))
                                .map((p) => (
                                    <li key={p.id}>
                                        {p.scheduledDate} – {p.title}
                                    </li>
                                ))}
                        </ul>
                        <p className="text-sm mt-2">You can generate new posts after the last scheduled day passes.</p>
                    </div>
                )}

                {/* Needs feedback section */}
                {needsFeedbackPosts && needsFeedbackPosts.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg border border-blue-300 bg-blue-50 text-blue-800">
                        <p className="font-semibold mb-1">Please provide feedback for past AI posts:</p>
                        <ul className="list-disc list-inside text-sm">
                            {needsFeedbackPosts.map((p) => (
                                <li key={p.id}>{p.scheduledDate} – {p.title}</li>
                            ))}
                        </ul>
                        <p className="text-sm mt-2">Your feedback helps AI improve future posts.</p>
                    </div>
                )}
            </div>

            {/* Display existing upcoming posts */}
            {upcomingPosts && upcomingPosts.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Scheduled AI Posts</h3>
                    {upcomingPosts
                        .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))
                        .map((post, index) => (
                            <div key={post.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-blue-600">{post.day || `Day ${index + 1}`}</h4>
                                        <p className="text-sm text-gray-500">Facebook Post - Scheduled for {post.scheduledDate}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        SCHEDULED
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {/* Post Title */}
                                    <div>
                                        <h5 className="font-semibold text-gray-800 mb-2">Title:</h5>
                                        <p className="text-lg font-medium text-blue-600">{post.title}</p>
                                    </div>

                                    {/* Post Content */}
                                    <div>
                                        <h5 className="font-semibold text-gray-800 mb-2">Content:</h5>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-800">{post.content}</pre>
                                        </div>
                                    </div>

                                    {/* Post Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-semibold text-gray-800 mb-2">Posting Details:</h5>
                                            <ul className="space-y-1 text-sm">
                                                <li><span className="font-medium">Platform:</span> {post.suggestedPlatforms.join(', ')}</li>
                                                <li><span className="font-medium">Best time:</span> {post.postingTime}</li>
                                                <li><span className="font-medium">Estimated reach:</span> {post.estimatedReach}</li>
                                                <li><span className="font-medium">Paid promotion:</span> {post.paidPromotion ? 'Recommended' : 'Not necessary'}</li>
                                                {post.budgetRecommendation && (
                                                    <li><span className="font-medium">Budget:</span> {post.budgetRecommendation}</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div>
                                            <h5 className="font-semibold text-gray-800 mb-2">Hashtags:</h5>
                                            <div className="flex flex-wrap gap-1">
                                                {post.hashtags.map((hashtag, hashtagIndex) => (
                                                    <span key={hashtagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                        {hashtag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call to Action */}
                                    <div>
                                        <h5 className="font-semibold text-gray-800 mb-2">Call to Action:</h5>
                                        <p className="text-green-600 font-medium">{post.callToAction}</p>
                                    </div>

                                    {/* Image Recommendations */}
                                    {post.imageRecommendations && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                📸 Bilde-Anbefalinger
                                            </h5>
                                            
                                            <div className="space-y-4">
                                                {/* What to Photograph */}
                                                <div>
                                                    <h6 className="font-medium text-blue-700 mb-2">Hva skal du fotografere:</h6>
                                                    <p className="text-blue-800">{post.imageRecommendations.whatToPhotograph}</p>
                                                </div>

                                                {/* Photo Tips */}
                                                <div>
                                                    <h6 className="font-medium text-blue-700 mb-2">Fototips:</h6>
                                                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                                                        {post.imageRecommendations.photoTips.map((tip, tipIndex) => (
                                                            <li key={tipIndex}>{tip}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Image Description */}
                                                <div>
                                                    <h6 className="font-medium text-blue-700 mb-2">Hvordan bildet skal se ut:</h6>
                                                    <p className="text-blue-800">{post.imageRecommendations.imageDescription}</p>
                                                </div>

                                                {/* ChatGPT Prompt */}
                                                <div>
                                                    <h6 className="font-medium text-blue-700 mb-2">ChatGPT Prompt for bildeforbedring:</h6>
                                                    <div className="bg-white p-3 rounded border border-blue-300">
                                                        <p className="text-sm text-gray-700 font-mono">{post.imageRecommendations.chatgptPrompt}</p>
                                                    </div>
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        💡 Kopier denne prompten og send den til ChatGPT sammen med bildet ditt for å få et forbedret bilde tilbake!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Feedback Section */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3">Post Performance Feedback</h5>
                                        
                                        {/* Basic Feedback */}
                                        <div className="mb-4">
                                            <h6 className="font-medium text-gray-700 mb-2">Overall Rating:</h6>
                                            <div className="flex items-center gap-4 text-sm">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`feedback-${post.id}`}
                                                        checked={post.feedback === 'helpful'}
                                                        onChange={() => handleFeedbackChange(post.id, 'helpful')}
                                                    />
                                                    <span className="text-green-700">Helpful</span>
                                                </label>
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`feedback-${post.id}`}
                                                        checked={post.feedback === 'not_helpful'}
                                                        onChange={() => handleFeedbackChange(post.id, 'not_helpful')}
                                                    />
                                                    <span className="text-red-700">Not helpful</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Detailed Feedback */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h6 className="font-medium text-gray-700 mb-2">Engagement Level:</h6>
                                                <select 
                                                    value={post.detailedFeedback?.engagement || ''}
                                                    onChange={(e) => handleDetailedFeedbackChange(post.id, 'engagement', e.target.value)}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="high">High engagement</option>
                                                    <option value="medium">Medium engagement</option>
                                                    <option value="low">Low engagement</option>
                                                </select>
                                            </div>

                                            <div>
                                                <h6 className="font-medium text-gray-700 mb-2">Sales Impact:</h6>
                                                <select 
                                                    value={post.detailedFeedback?.salesImpact || ''}
                                                    onChange={(e) => handleDetailedFeedbackChange(post.id, 'salesImpact', e.target.value)}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="positive">Positive impact</option>
                                                    <option value="neutral">No impact</option>
                                                    <option value="negative">Negative impact</option>
                                                </select>
                                            </div>

                                            <div>
                                                <h6 className="font-medium text-gray-700 mb-2">Content Quality:</h6>
                                                <select 
                                                    value={post.detailedFeedback?.contentQuality || ''}
                                                    onChange={(e) => handleDetailedFeedbackChange(post.id, 'contentQuality', e.target.value)}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="excellent">Excellent</option>
                                                    <option value="good">Good</option>
                                                    <option value="poor">Poor</option>
                                                </select>
                                            </div>

                                            <div>
                                                <h6 className="font-medium text-gray-700 mb-2">Posting Timing:</h6>
                                                <select 
                                                    value={post.detailedFeedback?.timing || ''}
                                                    onChange={(e) => handleDetailedFeedbackChange(post.id, 'timing', e.target.value)}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="perfect">Perfect timing</option>
                                                    <option value="good">Good timing</option>
                                                    <option value="poor">Poor timing</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h6 className="font-medium text-gray-700 mb-2">Additional Notes:</h6>
                                            <textarea 
                                                value={post.detailedFeedback?.notes || ''}
                                                onChange={(e) => handleDetailedFeedbackChange(post.id, 'notes', e.target.value)}
                                                placeholder="Any additional feedback to help AI improve..."
                                                className="w-full p-2 border rounded text-sm h-20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Generated Posts Timeline */}
            {generatedPosts.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">2-Day Marketing Plan</h3>
                    {generatedPosts.map((post, index) => (
                        <div key={post.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-600">{post.day || `Day ${index + 1}`}</h4>
                                    <p className="text-sm text-gray-500">Facebook Post</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    AI-GENERATED
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Post Title */}
                                <div>
                                    <h5 className="font-semibold text-gray-800 mb-2">Title:</h5>
                                    <p className="text-lg font-medium text-blue-600">{post.title}</p>
                                </div>

                                {/* Post Content */}
                                <div>
                                    <h5 className="font-semibold text-gray-800 mb-2">Content:</h5>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-800">{post.content}</pre>
                                    </div>
                                </div>

                                {/* Post Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-semibold text-gray-800 mb-2">Posting Details:</h5>
                                        <ul className="space-y-1 text-sm">
                                            <li><span className="font-medium">Platform:</span> {post.suggestedPlatforms.join(', ')}</li>
                                            <li><span className="font-medium">Best time:</span> {post.postingTime}</li>
                                            <li><span className="font-medium">Estimated reach:</span> {post.estimatedReach}</li>
                                            <li><span className="font-medium">Paid promotion:</span> {post.paidPromotion ? 'Recommended' : 'Not necessary'}</li>
                                            {post.budgetRecommendation && (
                                                <li><span className="font-medium">Budget:</span> {post.budgetRecommendation}</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div>
                                        <h5 className="font-semibold text-gray-800 mb-2">Hashtags:</h5>
                                        <div className="flex flex-wrap gap-1">
                                            {post.hashtags.map((hashtag, hashtagIndex) => (
                                                <span key={hashtagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {hashtag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Call to Action */}
                                <div>
                                    <h5 className="font-semibold text-gray-800 mb-2">Call to Action:</h5>
                                    <p className="text-green-600 font-medium">{post.callToAction}</p>
                                </div>

                                {/* Image Recommendations */}
                                {post.imageRecommendations && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                            📸 Bilde-Anbefalinger
                                        </h5>
                                        
                                        <div className="space-y-4">
                                            {/* What to Photograph */}
                                            <div>
                                                <h6 className="font-medium text-blue-700 mb-2">Hva skal du fotografere:</h6>
                                                <p className="text-blue-800">{post.imageRecommendations.whatToPhotograph}</p>
                                            </div>

                                            {/* Photo Tips */}
                                            <div>
                                                <h6 className="font-medium text-blue-700 mb-2">Fototips:</h6>
                                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                                    {post.imageRecommendations.photoTips.map((tip, tipIndex) => (
                                                        <li key={tipIndex}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Image Description */}
                                            <div>
                                                <h6 className="font-medium text-blue-700 mb-2">Hvordan bildet skal se ut:</h6>
                                                <p className="text-blue-800">{post.imageRecommendations.imageDescription}</p>
                                            </div>

                                            {/* ChatGPT Prompt */}
                                            <div>
                                                <h6 className="font-medium text-blue-700 mb-2">ChatGPT Prompt for bildeforbedring:</h6>
                                                <div className="bg-white p-3 rounded border border-blue-300">
                                                    <p className="text-sm text-gray-700 font-mono">{post.imageRecommendations.chatgptPrompt}</p>
                                                </div>
                                                <p className="text-xs text-blue-600 mt-2">
                                                    💡 Kopier denne prompten og send den til ChatGPT sammen med bildet ditt for å få et forbedret bilde tilbake!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Enhanced Feedback Section */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3">Post Performance Feedback</h5>
                                    
                                    {/* Basic Feedback */}
                                    <div className="mb-4">
                                        <h6 className="font-medium text-gray-700 mb-2">Overall Rating:</h6>
                                        <div className="flex items-center gap-4 text-sm">
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`feedback-${post.id}`}
                                                    checked={post.feedback === 'helpful'}
                                                    onChange={() => handleFeedbackChange(post.id, 'helpful')}
                                                />
                                                <span className="text-green-700">Helpful</span>
                                            </label>
                                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`feedback-${post.id}`}
                                                    checked={post.feedback === 'not_helpful'}
                                                    onChange={() => handleFeedbackChange(post.id, 'not_helpful')}
                                                />
                                                <span className="text-red-700">Not helpful</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Detailed Feedback */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h6 className="font-medium text-gray-700 mb-2">Engagement Level:</h6>
                                            <select 
                                                value={post.detailedFeedback?.engagement || ''}
                                                onChange={(e) => handleDetailedFeedbackChange(post.id, 'engagement', e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                            >
                                                <option value="">Select...</option>
                                                <option value="high">High engagement</option>
                                                <option value="medium">Medium engagement</option>
                                                <option value="low">Low engagement</option>
                                            </select>
                                        </div>

                                        <div>
                                            <h6 className="font-medium text-gray-700 mb-2">Sales Impact:</h6>
                                            <select 
                                                value={post.detailedFeedback?.salesImpact || ''}
                                                onChange={(e) => handleDetailedFeedbackChange(post.id, 'salesImpact', e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                            >
                                                <option value="">Select...</option>
                                                <option value="positive">Positive impact</option>
                                                <option value="neutral">No impact</option>
                                                <option value="negative">Negative impact</option>
                                            </select>
                                        </div>

                                        <div>
                                            <h6 className="font-medium text-gray-700 mb-2">Content Quality:</h6>
                                            <select 
                                                value={post.detailedFeedback?.contentQuality || ''}
                                                onChange={(e) => handleDetailedFeedbackChange(post.id, 'contentQuality', e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                            >
                                                <option value="">Select...</option>
                                                <option value="excellent">Excellent</option>
                                                <option value="good">Good</option>
                                                <option value="poor">Poor</option>
                                            </select>
                                        </div>

                                        <div>
                                            <h6 className="font-medium text-gray-700 mb-2">Posting Timing:</h6>
                                            <select 
                                                value={post.detailedFeedback?.timing || ''}
                                                onChange={(e) => handleDetailedFeedbackChange(post.id, 'timing', e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                            >
                                                <option value="">Select...</option>
                                                <option value="perfect">Perfect timing</option>
                                                <option value="good">Good timing</option>
                                                <option value="poor">Poor timing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h6 className="font-medium text-gray-700 mb-2">Additional Notes:</h6>
                                        <textarea 
                                            value={post.detailedFeedback?.notes || ''}
                                            onChange={(e) => handleDetailedFeedbackChange(post.id, 'notes', e.target.value)}
                                            placeholder="Any additional feedback to help AI improve..."
                                            className="w-full p-2 border rounded text-sm h-20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Data Message */}
            {!loading && generatedPosts.length === 0 && !error && (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">Ingen markedsføringsposter generert ennå.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Legg til salgsdata, værinformasjon eller byhendelser for å generere AI-drevne markedsføringsposter med bilde-anbefalinger.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIPostGenerator; 