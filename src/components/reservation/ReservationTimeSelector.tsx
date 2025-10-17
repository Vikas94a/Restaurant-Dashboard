import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface ReservationTimeSelectorProps {
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  availableTimes: string[];
  isTimeValid: (date: string, time: string) => boolean;
  restaurantDetails: any;
}

export default function ReservationTimeSelector({
  selectedDate,
  selectedTime,
  onTimeSelect,
  availableTimes,
  isTimeValid,
  restaurantDetails
}: ReservationTimeSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4">
          <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Select Time</h3>
          <p className="text-sm text-gray-600">Choose your preferred time</p>
        </div>
      </div>

      {/* Time Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        {availableTimes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableTimes.map((time) => {
              const isSelected = selectedTime === time;
              const isValid = isTimeValid(selectedDate, time);
              
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onTimeSelect(time)}
                  disabled={!isValid}
                  className={`relative p-4 text-sm rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg scale-105'
                      : isValid
                      ? 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-lg">{time}</div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-orange-500" />
                    </div>
                  )}
                  
                  {!isValid && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-700 font-medium">No available times for this date</p>
            <p className="text-sm text-gray-500 mt-2">
              Please select a different date
            </p>
          </div>
        )}
      </div>

      {/* Show warning if selected time is invalid */}
      {selectedTime && !isTimeValid(selectedDate, selectedTime) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-sm text-red-800">
              <p className="font-medium">Selected time is in the past</p>
              <p className="mt-1">Please choose a future time.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
