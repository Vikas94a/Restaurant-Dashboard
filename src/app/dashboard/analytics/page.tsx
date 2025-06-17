"use client";

import React, { useState } from 'react';
import AnalyticsNavigation from '@/components/dashboardcomponent/AnalyticsNavigation';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Star, ThumbsUp, Lightbulb, Target } from 'lucide-react';
import { PerformanceChart } from '@/components/dashboardcomponent/analytics/performance';

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-gray-900">1,247</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +12.5% from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900">24,567 kr</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +8.2% from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Customers</p>
                                        <p className="text-2xl font-bold text-gray-900">892</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +15.3% from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                                        <p className="text-2xl font-bold text-gray-900">4.8</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +0.2 from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <Star className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <PerformanceChart />
                    </div>
                );

            case 'menu-insight':
                return (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Performance</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">Margherita Pizza</p>
                                        <p className="text-sm text-gray-600">Most popular item</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">247 orders</p>
                                        <p className="text-sm text-green-600">+23% this month</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">Caesar Salad</p>
                                        <p className="text-sm text-gray-600">Highest profit margin</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">156 orders</p>
                                        <p className="text-sm text-green-600">+18% this month</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'feedback-insight':
                return (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback Analysis</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ThumbsUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Positive Feedback</p>
                                        <p className="text-sm text-gray-600">Fast delivery and great taste</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="font-semibold text-green-600">87%</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-900">Recent Reviews:</p>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-700">"Amazing pizza! Will definitely order again."</p>
                                        <p className="text-xs text-gray-500 mt-1">★★★★★ - 2 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'ai-suggestion':
                return (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Recommendations</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Lightbulb className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Menu Optimization</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Consider adding a vegetarian burger to your menu. Based on customer feedback and market trends, 
                                            this could increase revenue by 15-20%.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <Target className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Peak Hours Optimization</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Your busiest hours are 12-2 PM and 7-9 PM. Consider offering a "Happy Hour" 
                                            discount during 3-6 PM to increase afternoon sales.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AnalyticsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="p-6">
                {renderTabContent()}
            </div>
        </div>
    );
}