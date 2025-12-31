"use client";

import { useState } from "react";
import { useAIPostGenerator, MarketingPost, RestaurantDetails } from './AIPostGenerator/useAIPostGenerator';
import type { WeatherDay } from "./weatherData";
import type { CityEvent } from "./events";
import { FacebookPostService } from "@/services/facebookPostService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

// Types moved to hook

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
// Types moved to hook

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
    const {
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
    } = useAIPostGenerator({
        topSellingItems,
        weatherData,
        cityEvents,
        restaurantName,
        restaurantType,
        city,
        restaurantDetails,
        onPostGenerated
    });

    // State for tracking Facebook posting
    const [postingStates, setPostingStates] = useState<{ [postId: string]: { loading: boolean; success: boolean; error: string | null } }>({});

    // Manual generation only - no auto-generation

    // Generate 2 days of posts automatically (first and third day)
    const regeneratePosts = () => {
        // In this simplified refactor, just call generate again
        generatePosts();
    };

    // Handle posting to Facebook
    const handlePostToFacebook = async (post: MarketingPost) => {
        // Set posting state to loading
        setPostingStates(prev => ({
            ...prev,
            [post.id]: { loading: true, success: false, error: null }
        }));

        try {
            // Post to Facebook using the service
            await FacebookPostService.postMarketingPost({
                content: post.content,
                hashtags: post.hashtags,
                callToAction: post.callToAction,
                imageUrl: undefined // TODO: Add image support if needed
            });

            // Set success state
            setPostingStates(prev => ({
                ...prev,
                [post.id]: { loading: false, success: true, error: null }
            }));

            // Clear success state after 3 seconds
            setTimeout(() => {
                setPostingStates(prev => {
                    const newState = { ...prev };
                    delete newState[post.id];
                    return newState;
                });
            }, 3000);
        } catch (error: any) {
            // Set error state
            setPostingStates(prev => ({
                ...prev,
                [post.id]: { loading: false, success: false, error: error.message || 'Failed to post to Facebook' }
            }));
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
                    Generate 3 days of Facebook marketing posts (Day 1, Day 3, Day 5) based on weather, events, and sales data. 
                    Includes image recommendations and ChatGPT prompts for image enhancement. Smart paid promotion recommendations only when it creates real value.
                </p>

                {loading && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Generating your 3-day marketing plan with AI...</p>
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

                {/* Needs feedback section - now shows posts that need feedback with full feedback options */}
                {needsFeedbackPosts && needsFeedbackPosts.length > 0 && (
                    <div className="mt-6 space-y-6">
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow p-6 border border-red-200">
                            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                                ⚠️ Posts Requiring Feedback
                            </h3>
                            <p className="text-red-700 mb-4">
                                Please provide feedback for these past AI posts to help improve future recommendations.
                            </p>
                        </div>

                        {needsFeedbackPosts
                            .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))
                            .map((post, index) => (
                                <div key={post.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-red-600">{post.day || (index === 0 ? 'Day 1' : index === 1 ? 'Day 3' : 'Day 5')}</h4>
                                            <p className="text-sm text-gray-500">Facebook Post - Posted on {post.scheduledDate}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            processingFeedback.has(post.id)
                                                ? 'bg-blue-100 text-blue-800'
                                                : post.feedback 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                        }`}>
                                            {processingFeedback.has(post.id) 
                                                ? 'AI PROCESSING' 
                                                : post.feedback 
                                                    ? 'FEEDBACK PROVIDED' 
                                                    : 'NEEDS FEEDBACK'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Post Title */}
                                        <div>
                                            <h5 className="font-semibold text-gray-800 mb-2">Title:</h5>
                                            <p className="text-lg font-medium text-red-600">{post.title}</p>
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
                                                    📸 Image Recommendations
                                                </h5>
                                                
                                                <div className="space-y-4">
                                                    {/* What to Photograph */}
                                                    <div>
                                                        <h6 className="font-medium text-blue-700 mb-2">What to photograph:</h6>
                                                        <p className="text-blue-800">{post.imageRecommendations.whatToPhotograph}</p>
                                                    </div>

                                                    {/* Photo Tips */}
                                                    <div>
                                                        <h6 className="font-medium text-blue-700 mb-2">Photo tips:</h6>
                                                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                                                            {post.imageRecommendations.photoTips.map((tip, tipIndex) => (
                                                                <li key={tipIndex}>{tip}</li>
                            ))}
                        </ul>
                                                    </div>

                                                    {/* Image Description */}
                                                    <div>
                                                        <h6 className="font-medium text-blue-700 mb-2">How the image should look:</h6>
                                                        <p className="text-blue-800">{post.imageRecommendations.imageDescription}</p>
                                                    </div>

                                                    {/* ChatGPT Prompt */}
                                                    <div>
                                                        <h6 className="font-medium text-blue-700 mb-2">ChatGPT Prompt for image enhancement:</h6>
                                                        <div className="bg-white p-3 rounded border border-blue-300">
                                                            <p className="text-sm text-gray-700 font-mono">{post.imageRecommendations.chatgptPrompt}</p>
                                                        </div>
                                                        <p className="text-xs text-blue-600 mt-2">
                                                            💡 Copy this prompt and send it to ChatGPT along with your image to get an enhanced image back!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Enhanced Feedback Section */}
                                        <div className={`mt-6 p-4 rounded-lg border ${
                                            post.feedback 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-red-50 border-red-200'
                                        }`}>
                                            <h5 className={`font-semibold mb-3 flex items-center gap-2 ${
                                                processingFeedback.has(post.id)
                                                    ? 'text-blue-800'
                                                    : post.feedback 
                                                        ? 'text-green-800' 
                                                        : 'text-red-800'
                                            }`}>
                                                {processingFeedback.has(post.id) ? '🤖' : '📝'} Post Performance Feedback {
                                                    processingFeedback.has(post.id) 
                                                        ? '(AI Learning)' 
                                                        : post.feedback 
                                                            ? '(Completed)' 
                                                            : '(Required)'
                                                }
                                            </h5>
                                            
                                            {/* Basic Feedback */}
                                            <div className="mb-4">
                                                <h6 className={`font-medium mb-2 ${
                                                    post.feedback 
                                                        ? 'text-green-700' 
                                                        : 'text-red-700'
                                                }`}>Overall Rating:</h6>
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
                                                    <h6 className={`font-medium mb-2 ${
                                                        post.feedback 
                                                            ? 'text-green-700' 
                                                            : 'text-red-700'
                                                    }`}>Engagement Level:</h6>
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
                                                    <h6 className={`font-medium mb-2 ${
                                                        post.feedback 
                                                            ? 'text-green-700' 
                                                            : 'text-red-700'
                                                    }`}>Sales Impact:</h6>
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
                                                    <h6 className={`font-medium mb-2 ${
                                                        post.feedback 
                                                            ? 'text-green-700' 
                                                            : 'text-red-700'
                                                    }`}>Content Quality:</h6>
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
                                                    <h6 className={`font-medium mb-2 ${
                                                        post.feedback 
                                                            ? 'text-green-700' 
                                                            : 'text-red-700'
                                                    }`}>Posting Timing:</h6>
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
                                                <h6 className={`font-medium mb-2 ${
                                                    post.feedback 
                                                        ? 'text-green-700' 
                                                        : 'text-red-700'
                                                }`}>Additional Notes:</h6>
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
                                    <h4 className="text-lg font-semibold text-blue-600">{post.day || (index === 0 ? 'Day 1' : index === 1 ? 'Day 3' : 'Day 5')}</h4>
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
                                                <li><span className="font-medium">Paid promotion:</span> {post.paidPromotion ? 'Recommended (Smart Value-Based)' : 'Not recommended (Organic reach sufficient)'}</li>
                                                {post.budgetRecommendation && (
                                                    <li><span className="font-medium">Budget & ROI:</span> {post.budgetRecommendation}</li>
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

                                    {/* Post to Facebook Button */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        {postingStates[post.id]?.success ? (
                                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Posted to Facebook successfully!</span>
                                            </div>
                                        ) : postingStates[post.id]?.error ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Error posting to Facebook</span>
                                                </div>
                                                <p className="text-sm text-red-500">{postingStates[post.id].error}</p>
                                                <button
                                                    onClick={() => handlePostToFacebook(post)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
                                                >
                                                    <FontAwesomeIcon icon={faFacebook as IconProp} />
                                                    <span>Try Again</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePostToFacebook(post)}
                                                disabled={postingStates[post.id]?.loading}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 inline-flex items-center gap-2 font-medium"
                                            >
                                                {postingStates[post.id]?.loading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Posting to Facebook...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faFacebook as IconProp} />
                                                        <span>Post to Facebook</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
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
                    <h3 className="text-lg font-semibold">3-Day Marketing Plan</h3>
                    {generatedPosts.map((post, index) => (
                        <div key={post.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-600">{post.day || (index === 0 ? 'Day 1' : index === 1 ? 'Day 3' : 'Day 5')}</h4>
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
                                            <li><span className="font-medium">Paid promotion:</span> {post.paidPromotion ? 'Recommended (Smart Value-Based)' : 'Not recommended (Organic reach sufficient)'}</li>
                                            {post.budgetRecommendation && (
                                                <li><span className="font-medium">Budget & ROI:</span> {post.budgetRecommendation}</li>
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

                                {/* Post to Facebook Button */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    {postingStates[post.id]?.success ? (
                                        <div className="flex items-center gap-2 text-green-600 font-medium">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Posted to Facebook successfully!</span>
                                        </div>
                                    ) : postingStates[post.id]?.error ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-red-600 font-medium">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                                <span>Error posting to Facebook</span>
                                            </div>
                                            <p className="text-sm text-red-500">{postingStates[post.id].error}</p>
                                            <button
                                                onClick={() => handlePostToFacebook(post)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faFacebook as IconProp} />
                                                <span>Try Again</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePostToFacebook(post)}
                                            disabled={postingStates[post.id]?.loading}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 inline-flex items-center gap-2 font-medium"
                                        >
                                            {postingStates[post.id]?.loading ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Posting to Facebook...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faFacebook as IconProp} />
                                                    <span>Post to Facebook</span>
                                                </>
                                            )}
                                        </button>
                                    )}
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
            )}good 
            
        </div>
    );
};

export default AIPostGenerator; 