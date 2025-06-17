"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppSelector } from '@/store/hooks';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Define interfaces for type safety
interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: Timestamp;
  customerDetails: CustomerDetails;
  items: Array<any>;
  pickupOption: 'asap' | 'later';
  pickupTime: string;
  restaurantId: string;
  status: 'accepted' | 'pending' | 'completed' | 'cancelled';
  total: number;
  estimatedPickupTime?: string;
}

interface SalesData {
  date: string;
  total: number;
  orders: number;
  completedOrders: number;
}

export default function PerformanceChart() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { restaurantDetails } = useAppSelector((state) => state.auth);

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
        })) as Order[];

        // Create a map of dates with initial values
        const dateMap = new Map<string, { total: number; orders: number; completedOrders: number }>();
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        
        // Ensure we have data for all days in the range
        days.forEach(date => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          dateMap.set(formattedDate, { total: 0, orders: 0, completedOrders: 0 });
        });

        // Aggregate sales data by date
        orders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          const date = format(orderDate, 'yyyy-MM-dd');
          const current = dateMap.get(date) || { total: 0, orders: 0, completedOrders: 0 };
          
          // Only count completed orders in revenue
          if (order.status === 'completed') {
            dateMap.set(date, {
              total: current.total + (order.total || 0),
              orders: current.orders + 1,
              completedOrders: current.completedOrders + 1,
            });
          } else {
            // Count all orders in total orders
            dateMap.set(date, {
              ...current,
              orders: current.orders + 1,
            });
          }
        });

        // Convert map to array and ensure proper date ordering
        const data = days.map(date => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          const dayData = dateMap.get(formattedDate) || { total: 0, orders: 0, completedOrders: 0 };
          return {
            date: formattedDate,
            ...dayData
          };
        });

        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange, restaurantDetails?.restaurantId]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        <div className="relative">
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
          {isDatePickerOpen && (
            <div className="absolute z-50 mt-2">
              <DatePicker
                selected={dateRange.from}
                onChange={(dates) => {
                  const [start, end] = dates;
                  setDateRange({
                    from: start || dateRange.from,
                    to: end || start || dateRange.to,
                  });
                  if (end) {
                    setIsDatePickerOpen(false);
                  }
                }}
                startDate={dateRange.from}
                endDate={dateRange.to}
                selectsRange
                inline
                maxDate={new Date()}
                monthsShown={2}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={salesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'total' ? `${value.toFixed(2)} kr` : value,
                  name === 'total' ? 'Revenue' : name === 'completedOrders' ? 'Completed Orders' : 'Total Orders',
                ]}
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="completedOrders"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name="Completed Orders"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
                name="Total Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">
            {salesData.reduce((sum, day) => sum + day.total, 0).toFixed(2)} kr
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-600">Completed Orders</p>
          <p className="text-2xl font-bold text-green-900">
            {salesData.reduce((sum, day) => sum + day.completedOrders, 0)}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Total Orders</p>
          <p className="text-2xl font-bold text-purple-900">
            {salesData.reduce((sum, day) => sum + day.orders, 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}