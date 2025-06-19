"use client";

import React, { useState, useEffect } from 'react';
import AnalyticsNavigation from '@/components/dashboardcomponent/AnalyticsNavigation';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Star, ThumbsUp, Lightbulb, Target } from 'lucide-react';
import { PerformanceChart } from '@/components/dashboardcomponent/analytics/performance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import MenuInsight from '@/components/dashboardcomponent/analytics/MenuInsight';

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

    const handleDataUpdate = (orders: number, revenue: number) => {
        setTotalOrders(orders);
        setTotalRevenue(revenue);
    };

    const fetchCategoryData = async () => {
        // Fetch category data from the menu subcollection
        // This is a placeholder for the actual implementation
        const categories = [
            { name: 'Category A', value: 30 },
            { name: 'Category B', value: 20 },
            { name: 'Category C', value: 50 },
        ];
        setCategoryData(categories);
    };

    useEffect(() => {
        fetchCategoryData();
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Orders this week</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
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
                                        <p className="text-sm font-medium text-gray-600">Revenue this week</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalRevenue.toFixed(2)} kr</p>
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
                                        <p className="text-sm font-medium text-gray-600">Category Sales</p>
                                        <div className="h-60 w-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        innerRadius={20}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {categoryData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
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
                        <PerformanceChart onDataUpdate={handleDataUpdate} />

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback Analysis (Last 2 Days)</h3>
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

            case 'menu-insight':
                return (
                    <div className="space-y-6">
                        <MenuInsight />
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