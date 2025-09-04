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
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Select Time</h3>
          <p className="text-sm text-gray-600">Choose your preferred time</p>
        </div>
      </div>

      {/* Time Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {availableTimes.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {availableTimes.map((time) => {
              const isSelected = selectedTime === time;
              const isValid = isTimeValid(selectedDate, time);
              
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onTimeSelect(time)}
                  disabled={!isValid}
                  className={`relative p-3 text-sm rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                      : isValid
                      ? 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{time}</div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                    </div>
                  )}
                  
                  {!isValid && (
                    <div className="absolute top-1 right-1">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-yellow-500 mb-3" />
            <p className="text-gray-600">No available times for this date</p>
            <p className="text-sm text-gray-500 mt-1">
              Please select a different date
            </p>
          </div>
        )}
      </div>

      {/* Show warning if selected time is invalid */}
      {selectedTime && !isTimeValid(selectedDate, selectedTime) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              Selected time is in the past. Please choose a future time.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
