"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faLink, faCopy, faCheck, faUsers, faClock, faUtensils, faList } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

import { ReservationSettings } from '@/types/reservation';
import ReservationList from '@/components/dashboardcomponent/reservations/ReservationList';

export default function ReservationsPage() {
  const { user, restaurantDetails } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'reservations'>('settings');

  useEffect(() => {
    loadReservationSettings();
  }, [restaurantDetails]);

  const loadReservationSettings = async () => {
    if (!restaurantDetails?.restaurantId) return;

    try {
      setIsLoading(true);
      const restaurantRef = doc(db, 'restaurants', restaurantDetails.restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);

      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        const existingSettings = data.reservationSettings;
        
        if (existingSettings) {
          setSettings(existingSettings);
        } else {
          // First time setup - show default settings
          setSettings({
            enabled: false,
            maxPartySize: 10,
            minPartySize: 1,
            advanceBookingDays: 30,
            openingTime: '11:00',
            closingTime: '22:00',
            reservationLink: `https://aieateasy.no/reserve/${data.domain || 'restaurant'}`,
            reservationDuration: 90,
            maxReservationsPerTimeSlot: 3,
            timeSlotInterval: 30
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load reservation settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!restaurantDetails?.restaurantId || !settings) return;

    try {
      setIsSaving(true);
      const restaurantRef = doc(db, 'restaurants', restaurantDetails.restaurantId);
      
      await setDoc(restaurantRef, {
        reservationSettings: settings
      }, { merge: true });

      toast.success('Reservation settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save reservation settings');
    } finally {
      setIsSaving(false);
    }
  };

  const copyReservationLink = async () => {
    if (!settings?.reservationLink) return;

    try {
      await navigator.clipboard.writeText(settings.reservationLink);
      setCopied(true);
      toast.success('Reservation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleSettingChange = (key: keyof ReservationSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 text-orange-500 mr-3" />
          Table Reservations
        </h1>
        <p className="text-gray-600 mt-2">
          Set up your reservation system and get a link to share with customers
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reservations'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2" />
              Reservations
            </button>
          </nav>
        </div>
      </div>

              {activeTab === 'settings' ? (
          !settings ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
          {/* Enable/Disable Reservations */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Enable Table Reservations
                </h2>
                <p className="text-gray-600">
                  Allow customers to book tables through your reservation link
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          {/* Reservation Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-orange-500 mr-2" />
              Reservation Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Party Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.minPartySize}
                  onChange={(e) => handleSettingChange('minPartySize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxPartySize}
                  onChange={(e) => handleSettingChange('maxPartySize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Advance Booking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.advanceBookingDays}
                  onChange={(e) => handleSettingChange('advanceBookingDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => handleSettingChange('openingTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => handleSettingChange('closingTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reservation Duration (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  step="30"
                  value={settings.reservationDuration}
                  onChange={(e) => handleSettingChange('reservationDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Reservations per Time Slot
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxReservationsPerTimeSlot}
                  onChange={(e) => handleSettingChange('maxReservationsPerTimeSlot', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot Interval (minutes)
                </label>
                <select
                  value={settings.timeSlotInterval}
                  onChange={(e) => handleSettingChange('timeSlotInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reservation Link */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faLink} className="w-5 h-5 text-orange-500 mr-2" />
              Your Reservation Link
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Share this link with your customers:</p>
                  <p className="text-lg font-mono text-gray-900 break-all">
                    {settings.reservationLink}
                  </p>
                </div>
                <button
                  onClick={copyReservationLink}
                  className="ml-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center"
                >
                  <FontAwesomeIcon 
                    icon={copied ? faCheck : faCopy} 
                    className="w-4 h-4 mr-2" 
                  />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">How to use this link:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Add it to your restaurant website</li>
                <li>• Share it on social media</li>
                <li>• Include it in your Google Business profile</li>
                <li>• Print it on your physical menus</li>
              </ul>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )
    ) : (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FontAwesomeIcon icon={faList} className="w-5 h-5 text-orange-500 mr-2" />
            Manage Reservations
          </h2>
          <ReservationList />
        </div>
      </div>
    )}
    </div>
  );
} 