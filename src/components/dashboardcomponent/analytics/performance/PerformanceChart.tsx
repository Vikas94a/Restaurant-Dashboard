"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppSelector } from '@/store/hooks';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isSameWeek,
  isSameMonth
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SalesData {
  date: string;
  total: number;
  orders: number;
  completedOrders: number;
}

interface OrderData {
  id: string;
  createdAt: string;
  status: string;
  total: number;
}

interface PerformanceChartProps {
  onDataUpdate?: (orders: number, revenue: number) => void;
}

const QUICK_RANGES = [
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
];

export default function PerformanceChart({ onDataUpdate }: PerformanceChartProps) {
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date()),
    to: new Date(),
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { restaurantDetails } = useAppSelector((state) => state.auth);

  const handleQuickRangeSelect = (range: string) => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (range) {
      case 'thisWeek':
        from = startOfWeek(today);
        break;
      case 'lastWeek':
        from = startOfWeek(subWeeks(today, 1));
        to = endOfWeek(subWeeks(today, 1));
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      default:
        from = startOfWeek(today);
    }

    setDateRange({ from, to });
  };

  const formatDateLabel = (date: string) => {
    const dateObj = new Date(date);
    const isWeekRange = isSameWeek(dateObj, dateRange.from) || isSameWeek(dateObj, dateRange.to);
    const isMonthRange = isSameMonth(dateObj, dateRange.from) || isSameMonth(dateObj, dateRange.to);

    if (isWeekRange) {
      return format(dateObj, 'EEE'); // Mon, Tue, etc.
    } else if (isMonthRange) {
      return format(dateObj, 'MMM dd'); // Jan 01, Jan 02, etc.
    } else {
      return format(dateObj, 'MMM dd'); // Jan 01, Jan 02, etc.
    }
  };

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!restaurantDetails?.restaurantId) return;

      setIsLoading(true);
      try {
        const ordersRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'orders');
        const q = query(
          ordersRef,
          where('createdAt', '>=', startOfDay(dateRange.from).toISOString()),
          where('createdAt', '<=', endOfDay(dateRange.to).toISOString())
        );

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as OrderData[];

        // Create a map of dates with initial values
        const dateMap = new Map<string, { total: number; orders: number; completedOrders: number }>();
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        days.forEach(date => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          dateMap.set(formattedDate, { total: 0, orders: 0, completedOrders: 0 });
        });

        // Aggregate sales data by date
        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);
          const date = format(orderDate, 'yyyy-MM-dd');
          const current = dateMap.get(date) || { total: 0, orders: 0, completedOrders: 0 };
          if (order.status === 'completed') {
            dateMap.set(date, {
              total: current.total + (order.total || 0),
              orders: current.orders + 1,
              completedOrders: current.completedOrders + 1,
            });
          } else {
            dateMap.set(date, {
              ...current,
              orders: current.orders + 1,
            });
          }
        });

        const data = days.map(date => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          const dayData = dateMap.get(formattedDate) || { total: 0, orders: 0, completedOrders: 0 };
          return {
            date: formattedDate,
            ...dayData
          };
        });

        setSalesData(data);

        // Call onDataUpdate with total orders and revenue
        if (onDataUpdate) {
          const totalOrders = data.reduce((sum, day) => sum + day.orders, 0);
          const totalRevenue = data.reduce((sum, day) => sum + day.total, 0);
          onDataUpdate(totalOrders, totalRevenue);
        }
      } catch (error) {
        } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange, restaurantDetails?.restaurantId, onDataUpdate]);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_RANGES.map((range) => (
            <Button
              key={range.value}
              variant="outline"
              size="sm"
              onClick={() => handleQuickRangeSelect(range.value)}
              className={cn(
                "text-sm",
                dateRange.from === startOfWeek(new Date()) && range.value === 'thisWeek' && "bg-primary text-primary-foreground"
              )}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                label={{ value: 'Revenue (kr)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} kr`, 'Revenue']}
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Legend />
              <Bar
                dataKey="total"
                name="Revenue"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">
            {salesData.reduce((sum, day) => sum + day.total, 0).toFixed(2)} kr
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-600">Total Orders</p>
          <p className="text-2xl font-bold text-green-900">
            {salesData.reduce((sum, day) => sum + day.orders, 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}