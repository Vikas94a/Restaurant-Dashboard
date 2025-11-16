/**
 * AvailabilityMenu - Dropdown for selecting availability status
 * Works instantly without requiring Edit mode
 */

"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { AvailabilityState, AvailabilityStatus, getAvailabilityLabel } from '../types/availability';

interface AvailabilityMenuProps {
  currentAvailability: AvailabilityState;
  onAvailabilityChange: (availability: AvailabilityState) => void;
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; description: string }[] = [
  { value: 'available', label: 'Tilgjengelig', description: 'Synlig for kunder' },
  { value: 'unavailable_today', label: 'Utilgjengelig i dag', description: 'Tilbake i morgen' },
  { value: 'unavailable_indefinite', label: 'Utilgjengelig', description: 'Skjult for kunder' },
  { value: 'unavailable_until', label: 'Utilgjengelig til...', description: 'Velg dato og tid' },
];

export default function AvailabilityMenu({
  currentAvailability,
  onAvailabilityChange,
}: AvailabilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize date/time from current availability if it exists
  const getInitialDateTime = () => {
    if (currentAvailability.status === 'unavailable_until' && currentAvailability.until) {
      const untilDate = new Date(currentAvailability.until);
      const year = untilDate.getFullYear();
      const month = String(untilDate.getMonth() + 1).padStart(2, '0');
      const day = String(untilDate.getDate()).padStart(2, '0');
      const hours = String(untilDate.getHours()).padStart(2, '0');
      const minutes = String(untilDate.getMinutes()).padStart(2, '0');
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
      };
    }
    return { date: '', time: '' };
  };

  const initialDateTime = getInitialDateTime();
  const [selectedDate, setSelectedDate] = useState<string>(initialDateTime.date);
  const [selectedTime, setSelectedTime] = useState<string>(initialDateTime.time);
  const [showDateTimePicker, setShowDateTimePicker] = useState(
    currentAvailability.status === 'unavailable_until'
  );

  const handleOptionSelect = (status: AvailabilityStatus) => {
    if (status === 'unavailable_until') {
      // Show date/time picker
      setShowDateTimePicker(true);
      setIsOpen(true);
      // Initialize date/time if not already set
      if (!selectedDate) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
        setSelectedTime(`${hours}:${minutes}`);
      }
    } else {
      onAvailabilityChange({
        status,
        until: null,
      });
      setIsOpen(false);
      setShowDateTimePicker(false);
    }
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Vennligst velg både dato og tid');
      return;
    }

    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    if (isNaN(dateTime.getTime())) {
      toast.error('Ugyldig dato/tid');
      return;
    }

    onAvailabilityChange({
      status: 'unavailable_until',
      until: dateTime.toISOString(),
    });
    setIsOpen(false);
    setShowDateTimePicker(false);
    setSelectedDate('');
    setSelectedTime('');
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  };

  const minDateTime = getMinDateTime();

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
      >
        <span className="text-gray-700">
          {getAvailabilityLabel(currentAvailability.status)}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="py-1">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionSelect(option.value);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    currentAvailability.status === option.value ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                    {currentAvailability.status === option.value && (
                      <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {(showDateTimePicker || currentAvailability.status === 'unavailable_until') && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dato
                    </label>
                    <input
                      type="date"
                      min={minDateTime.date}
                      value={selectedDate || minDateTime.date}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tid
                    </label>
                    <input
                      type="time"
                      min={selectedDate === minDateTime.date ? minDateTime.time : undefined}
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDateTimeConfirm();
                    }}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Bekreft
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

