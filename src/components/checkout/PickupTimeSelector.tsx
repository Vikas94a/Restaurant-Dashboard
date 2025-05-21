import React from 'react';
import { CustomerFormData, RestaurantHours } from '@/types/checkout';

interface PickupTimeSelectorProps {
  formData: CustomerFormData;
  pickupOption: 'asap' | 'later';
  handleOptionChange: (option: 'asap' | 'later') => void;
  handleTimeChange: (time: string) => void;
  isAsapAvailable: boolean;
  availableLaterTimes: string[];
  todayHours: RestaurantHours | undefined;
  now: Date;
  openingTime: Date;
  nowWithBuffer: Date;
}

const PickupTimeSelector: React.FC<PickupTimeSelectorProps> = ({
  formData,
  pickupOption,
  handleOptionChange,
  handleTimeChange,
  isAsapAvailable,
  availableLaterTimes,
  todayHours,
  now,
  openingTime,
  nowWithBuffer
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
      <div className="space-y-2">
        {isAsapAvailable && (
          <div
            className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition ${pickupOption === 'asap' ? 'bg-primary/10 border-primary' : 'border-gray-300'}`}
            onClick={() => handleOptionChange('asap')}
          >
            <input
              type="radio"
              name="pickupOption"
              checked={pickupOption === 'asap'}
              onChange={() => handleOptionChange('asap')}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <label className="ml-3 text-sm text-gray-700 cursor-pointer">As soon as possible</label>
          </div>
        )}

        <div
          className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition ${pickupOption === 'later' ? 'bg-primary/10 border-primary' : 'border-gray-300'}`}
          onClick={() => handleOptionChange('later')}
        >
          <input
            type="radio"
            name="pickupOption"
            checked={pickupOption === 'later'}
            onChange={() => handleOptionChange('later')}
            className="h-4 w-4 text-primary focus:ring-primary"
          />
          <label className="ml-3 text-sm text-gray-700 cursor-pointer">Later</label>
        </div>

        {pickupOption === 'later' && (
          <div className="mt-3">
            {availableLaterTimes.length > 0 ? (
              <select
                value={formData.pickupTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
                required
              >
                {formData.pickupTime === '' && <option value="">Select a time</option>}
                {availableLaterTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">
                {!todayHours ? "Restaurant hours not available." :
                  todayHours.closed ? "Restaurant is closed today." :
                    now < openingTime ? `Restaurant opens at ${todayHours.open}.` :
                      "No available pickup times for later today."}
              </p>
            )}
          </div>
        )}

        {!isAsapAvailable && availableLaterTimes.length === 0 && (
          <p className="text-sm text-gray-500">
            {!todayHours ? "Restaurant hours not available." :
              todayHours.closed ? "Restaurant is closed today." :
                nowWithBuffer < openingTime ? `Restaurant opens at ${todayHours.open}.` :
                  "No available pickup times today. Please try again later."}
          </p>
        )}
      </div>
    </div>
  );
};

export default PickupTimeSelector;
