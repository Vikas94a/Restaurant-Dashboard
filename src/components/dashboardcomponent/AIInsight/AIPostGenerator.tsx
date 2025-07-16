"use client";

import { useState, useEffect } from "react";
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

    // Manual generation only - no auto-generation

    // Generate 2 days of posts automatically (first and third day)
    const generatePosts = async () => {
        setLoading(true);
        setError(null);

        try {
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
                    restaurantDetails
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
            } else {
                throw new Error('Invalid response from API');
            }

        } catch (err) {
            console.error("Error generating posts:", err);
            setError(err instanceof Error ? err.message : "Failed to generate posts");
        } finally {
            setLoading(false);
        }
    };

    const regeneratePosts = () => {
        setGeneratedPosts([]);
        generatePosts();
    };

    return (
        <div className="space-y-6">
            {/* Manual Generation Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">AI Marketing Post Generator</h3>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={generatePosts}
                            disabled={loading}
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
            </div>

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