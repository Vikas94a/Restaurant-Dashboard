"use client";

import { useState } from 'react';
import { ReservationService } from '@/services/reservationService';
import { CreateReservationRequest } from '@/types/reservation';
import { toast } from 'sonner';

export default function TestReservationPage() {
  const [testData, setTestData] = useState({
    restaurantId: '',
    domain: 'test-restaurant',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+1234567890',
    date: '2024-12-25',
    time: '18:00',
    partySize: 2
  });

  const handleTestReservation = async () => {
    try {
      const request: CreateReservationRequest = {
        restaurantId: testData.restaurantId,
        domain: testData.domain,
        customerDetails: {
          name: testData.customerName,
          email: testData.customerEmail,
          phone: testData.customerPhone
        },
        reservationDetails: {
          date: testData.date,
          time: testData.time,
          partySize: testData.partySize
        }
      };

      const reservation = await ReservationService.createReservation(request);
      toast.success(`Test reservation created with ID: ${reservation.id}`);
      console.log('Created reservation:', reservation);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create test reservation');
      console.error('Error:', error);
    }
  };

  const handleTestAvailability = async () => {
    try {
      const availability = await ReservationService.checkAvailability(
        testData.restaurantId,
        testData.date
      );
      toast.success('Availability checked successfully');
      console.log('Availability:', availability);
    } catch (error: any) {
      toast.error(error.message || 'Failed to check availability');
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reservation System Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant ID
            </label>
            <input
              type="text"
              value={testData.restaurantId}
              onChange={(e) => setTestData(prev => ({ ...prev, restaurantId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter restaurant ID from your dashboard"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={testData.customerName}
                onChange={(e) => setTestData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Size
              </label>
              <input
                type="number"
                value={testData.partySize}
                onChange={(e) => setTestData(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={testData.date}
                onChange={(e) => setTestData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={testData.time}
                onChange={(e) => setTestData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleTestAvailability}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Test Availability Check
            </button>
            <button
              onClick={handleTestReservation}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Test Create Reservation
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>First, go to your restaurant dashboard and enable reservations</li>
            <li>Copy the restaurant ID from the URL or settings</li>
            <li>Paste it in the Restaurant ID field above</li>
            <li>Test the availability check first</li>
            <li>Then test creating a reservation</li>
            <li>Check the console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
