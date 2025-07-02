import React from 'react';

interface PickupOptionsProps {
  pickupOption: 'asap' | 'later';
  setPickupOption: (option: 'asap' | 'later') => void;
  isAsapAvailable: boolean;
  pickupDate: string;
  setPickupDate: (date: string) => void;
  pickupTime: string;
  setPickupTime: (time: string) => void;
  availableDates: Array<{ date: string; display: string }>;
  availablePickupTimes: string[];
  isDateOpen: (date: string) => boolean;
  restaurantDetails: any;
}

export default function PickupOptions({
  pickupOption,
  setPickupOption,
  isAsapAvailable,
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  availableDates,
  availablePickupTimes,
  isDateOpen,
  restaurantDetails
}: PickupOptionsProps) {
  const handleOptionChange = (option: 'asap' | 'later') => {
    setPickupOption(option);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Pickup Options</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input 
              type="radio" 
              name="pickupOption" 
              value="asap" 
              checked={pickupOption === 'asap'} 
              onChange={(e) => handleOptionChange(e.target.value as 'asap' | 'later')} 
              className="mr-2" 
              disabled={!isAsapAvailable} 
            />
            As Soon as Possible
          </label>
          <label className="flex items-center">
            <input 
              type="radio" 
              name="pickupOption" 
              value="later" 
              checked={pickupOption === 'later'} 
              onChange={(e) => handleOptionChange(e.target.value as 'asap' | 'later')} 
              className="mr-2" 
            />
            Schedule for Later
          </label>
        </div>
        
        {pickupOption === 'later' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pickup Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableDates.map(({ date, display }) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setPickupDate(date)}
                    className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                      pickupDate === date
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {display}
                  </button>
                ))}
              </div>
              {availableDates.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No available dates in the next 7 days
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pickup Time
              </label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              >
                <option value="">Select a time</option>
                {availablePickupTimes.map((time: string) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {availablePickupTimes.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {!restaurantDetails?.openingHours ? "Restaurant hours not available" :
                    !isDateOpen(pickupDate) ? "Restaurant is closed on selected date" :
                    "No available pickup times for selected date"}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 