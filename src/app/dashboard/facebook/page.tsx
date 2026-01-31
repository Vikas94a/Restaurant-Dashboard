"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FacebookPostService } from "@/services/facebookPostService";
import Link from "next/link";

export default function FacebookPage() {
    const restaurantDetails = useAppSelector((state) => state.auth.restaurantDetails);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
    const [isPosting, setIsPosting] = useState(false);
    const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

    // Check connection status
    useEffect(() => {
        // For now, assume connected if we have restaurant details
        // In the future, this should check actual Facebook connection
        setConnectionStatus('connected');
    }, []);

    const handleTestPost = async () => {
        setIsPosting(true);
        setPostResult(null);
        
        try {
            const testMessage = `🎉 Test post from ${restaurantDetails?.name || 'Your Restaurant'}! \n\nThis is a test post to verify Facebook integration is working correctly.`;
            const postId = await FacebookPostService.postText(testMessage);
            setPostResult({
                success: true,
                message: `Post published successfully! Post ID: ${postId}`
            });
        } catch (error: any) {
            setPostResult({
                success: false,
                message: error.message || 'Failed to post to Facebook'
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faFacebook as IconProp} className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Facebook Integration</h1>
                            <p className="text-gray-600">Manage your Facebook page posts and integration</p>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className="mt-6 p-4 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Connection Status</h3>
                                <p className="text-sm text-gray-600">
                                    {connectionStatus === 'connected' && 'Your Facebook page is connected and ready to post'}
                                    {connectionStatus === 'disconnected' && 'Facebook page is not connected'}
                                    {connectionStatus === 'checking' && 'Checking connection status...'}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                                connectionStatus === 'connected' 
                                    ? 'bg-green-100 text-green-800' 
                                    : connectionStatus === 'disconnected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {connectionStatus === 'connected' ? '✓ Connected' : 
                                 connectionStatus === 'disconnected' ? '✗ Disconnected' : 
                                 'Checking...'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link 
                            href="/dashboard/ai-insight"
                            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Generate AI Posts</h3>
                                    <p className="text-sm text-gray-600">Create marketing posts with AI</p>
                                </div>
                            </div>
                        </Link>

                        <button
                            onClick={handleTestPost}
                            disabled={isPosting || connectionStatus !== 'connected'}
                            className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Test Post</h3>
                                    <p className="text-sm text-gray-600">
                                        {isPosting ? 'Posting...' : 'Send a test post to Facebook'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Post Result */}
                    {postResult && (
                        <div className={`mt-4 p-4 rounded-lg ${
                            postResult.success 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            <div className="flex items-start gap-3">
                                {postResult.success ? (
                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <div>
                                    <p className={`font-medium ${
                                        postResult.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {postResult.success ? 'Success!' : 'Error'}
                                    </p>
                                    <p className={`text-sm mt-1 ${
                                        postResult.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {postResult.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Facebook Features</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-sm font-bold">1</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">AI-Generated Posts</h3>
                                <p className="text-sm text-gray-600">
                                    Generate marketing posts automatically using AI based on your sales data, weather, and events. 
                                    Visit <Link href="/dashboard/ai-insight" className="text-blue-600 hover:underline font-medium">AI Insights</Link> to get started.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-sm font-bold">2</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Direct Posting</h3>
                                <p className="text-sm text-gray-600">
                                    Post generated content directly to your Facebook page with one click. All posts include hashtags and call-to-action messages.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-sm font-bold">3</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Scheduled Posts</h3>
                                <p className="text-sm text-gray-600">
                                    Schedule your marketing posts for optimal posting times. Posts are generated for specific days and can be posted immediately or scheduled.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Use */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">How to Post to Facebook</h2>
                    <ol className="space-y-3 list-decimal list-inside">
                        <li className="text-gray-700">
                            <span className="font-medium">Generate Posts:</span> Go to <Link href="/dashboard/ai-insight" className="text-blue-600 hover:underline">AI Insights</Link> and click "Generate Posts"
                        </li>
                        <li className="text-gray-700">
                            <span className="font-medium">Review Content:</span> Review the generated marketing posts with AI-powered recommendations
                        </li>
                        <li className="text-gray-700">
                            <span className="font-medium">Post to Facebook:</span> Click the "Post to Facebook" button on any generated post
                        </li>
                        <li className="text-gray-700">
                            <span className="font-medium">Confirm:</span> Your post will be published to your connected Facebook page
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}


