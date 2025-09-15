"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CustomerFeedback {
    rating: number;
    foodQuality: number;
    serviceExperience: number;
    valueForMoney: number;
    comments: string;
}

interface OrderData {
    id: string;
    customerDetails: {
        name: string;
        email: string;
    };
    items: Array<{
        itemName: string;
        quantity: number;
    }>;
    pickupTime: string;
    status: string;
}

interface FeedbackSubmission {
    orderId: string;
    customerName: string;
    customerEmail: string;
    feedback: CustomerFeedback;
    submittedAt: Date;
    restaurantId: string;
}

export default function CustomerFeedbackPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [feedback, setFeedback] = useState<CustomerFeedback>({
        rating: 0,
        foodQuality: 0,
        serviceExperience: 0,
        valueForMoney: 0,
        comments: ''
    });

    // Load order data and check if feedback already submitted
    useEffect(() => {
        const loadOrderData = async () => {
            try {
                if (!orderId) {
                    setError('Invalid feedback link');
                    setLoading(false);
                    return;
                }

                // Try to find the order in all restaurants
                const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
                let foundOrder: OrderData | null = null;
                let restaurantId: string | null = null;

                for (const restaurantDoc of restaurantsSnapshot.docs) {
                    const orderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', orderId);
                    const orderSnap = await getDoc(orderRef);
                    
                    if (orderSnap.exists()) {
                        foundOrder = { id: orderSnap.id, ...orderSnap.data() } as OrderData;
                        restaurantId = restaurantDoc.id;
                        break;
                    }
                }

                if (!foundOrder || !restaurantId) {
                    setError('Order not found');
                    setLoading(false);
                    return;
                }

                setOrderData(foundOrder);

                // Check if feedback already submitted
                const feedbackRef = doc(db, 'restaurants', restaurantId, 'customerFeedback', orderId);
                const feedbackSnap = await getDoc(feedbackRef);
                
                if (feedbackSnap.exists()) {
                    setAlreadySubmitted(true);
                }

            } catch (error) {
                console.error('Error loading order data:', error);
                setError('Failed to load order information');
            } finally {
                setLoading(false);
            }
        };

        loadOrderData();
    }, [orderId]);

    const handleRatingChange = (field: keyof CustomerFeedback, value: number) => {
        setFeedback(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!orderData || feedback.rating === 0) {
            setError('Please provide at least an overall rating');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Find restaurant ID again for submission
            const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
            let restaurantId: string | null = null;

            for (const restaurantDoc of restaurantsSnapshot.docs) {
                const orderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (orderSnap.exists()) {
                    restaurantId = restaurantDoc.id;
                    break;
                }
            }

            if (!restaurantId) {
                throw new Error('Restaurant not found');
            }

            const feedbackSubmission: FeedbackSubmission = {
                orderId,
                customerName: orderData.customerDetails.name,
                customerEmail: orderData.customerDetails.email,
                feedback,
                submittedAt: new Date(),
                restaurantId
            };

            // Process feedback through AI analysis
            const processResponse = await fetch('/api/process-customer-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...feedbackSubmission,
                    orderItems: orderData.items
                }),
            });

            if (!processResponse.ok) {
                console.error('Failed to process feedback with AI, but saving basic feedback');
                // Still save basic feedback even if AI processing fails
                const feedbackRef = doc(db, 'restaurants', restaurantId, 'customerFeedback', orderId);
                await setDoc(feedbackRef, feedbackSubmission);
            }

            // Update order to mark feedback as received
            const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
            await updateDoc(orderRef, {
                feedbackReceived: true,
                feedbackReceivedAt: new Date()
            });

            setSuccess(true);
            setAlreadySubmitted(true);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStarRating = (
        value: number,
        onChange: (value: number) => void,
        label: string
    ) => (
        <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
                {label}
            </label>
            <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`text-4xl transition-colors duration-200 ${
                            star <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                        }`}
                        disabled={submitting || alreadySubmitted}
                    >
                        ★
                    </button>
                ))}
            </div>
            <div className="text-center text-sm text-gray-600 mt-1">
                {value === 0 ? 'Tap a star to rate' : 
                 value === 1 ? 'Poor' :
                 value === 2 ? 'Fair' :
                 value === 3 ? 'Good' :
                 value === 4 ? 'Very Good' : 'Excellent'}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading feedback form...</p>
                </div>
            </div>
        );
    }

    if (error && !orderData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
                <div className="max-w-md mx-auto text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (alreadySubmitted || success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
                    <p className="text-gray-600 mb-4">
                        Your feedback has been successfully submitted to the restaurant.
                    </p>
                    <p className="text-sm text-gray-500">
                        Your input helps us improve our service and provide a better experience for all our customers.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">How was your experience?</h1>
                    <p className="text-gray-600">
                        Hi {orderData?.customerDetails.name}! We'd love to hear about your recent order.
                    </p>
                </div>

                {/* Order Summary */}
                {orderData && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Order Details</h2>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Order ID:</span> {orderData.id}</p>
                            <p><span className="font-medium">Pickup Time:</span> {orderData.pickupTime}</p>
                            <div>
                                <span className="font-medium">Items:</span>
                                <ul className="mt-1 ml-4">
                                    {orderData.items.map((item, index) => (
                                        <li key={index} className="text-gray-600">
                                            {item.quantity}x {item.itemName}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Form */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {renderStarRating(feedback.rating, (value) => 
                            handleRatingChange('rating', value), 
                            'Overall Experience'
                        )}
                        
                        {renderStarRating(feedback.foodQuality, (value) => 
                            handleRatingChange('foodQuality', value), 
                            'Food Quality'
                        )}
                        
                        {renderStarRating(feedback.serviceExperience, (value) => 
                            handleRatingChange('serviceExperience', value), 
                            'Service Experience'
                        )}
                        
                        {renderStarRating(feedback.valueForMoney, (value) => 
                            handleRatingChange('valueForMoney', value), 
                            'Value for Money'
                        )}

                        {/* Comments */}
                        <div className="mb-6">
                            <label className="block text-lg font-semibold text-gray-800 mb-3">
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                value={feedback.comments}
                                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Tell us more about your experience..."
                                disabled={submitting}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || feedback.rating === 0}
                            className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-colors duration-200 ${
                                submitting || feedback.rating === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                            }`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        Your feedback is anonymous and will be used to improve our service.
                    </p>
                </div>
            </div>
        </div>
    );
}
