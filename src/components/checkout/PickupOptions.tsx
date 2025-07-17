import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendar, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Hentealternativer</h2>
          <p className="text-sm text-gray-600">Velg hvordan du vil hente bestillingen</p>
        </div>
      </div>
      
      {/* Pickup Options */}
      <div className="space-y-4">
        {/* Radio Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ASAP Option */}
          <div
            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              pickupOption === 'asap' 
                ? 'border-orange-500 bg-orange-50 shadow-md' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
            } ${!isAsapAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => isAsapAvailable && handleOptionChange('asap')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                pickupOption === 'asap' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300 group-hover:border-orange-400'
              }`}>
                {pickupOption === 'asap' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-800 cursor-pointer">
                  Så snart som mulig
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  {isAsapAvailable ? 'Klar om 15-20 minutter' : 'Ikke tilgjengelig nå'}
                </p>
              </div>
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Later Option */}
          <div
            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              pickupOption === 'later' 
                ? 'border-orange-500 bg-orange-50 shadow-md' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
            }`}
            onClick={() => handleOptionChange('later')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                pickupOption === 'later' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300 group-hover:border-orange-400'
              }`}>
                {pickupOption === 'later' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-800 cursor-pointer">
                  Planlegg for senere
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Velg dato og tid som passer deg
                </p>
              </div>
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendar} className="w-3 h-3 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Later Options Details */}
        {pickupOption === 'later' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Date Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-orange-500 mr-2" />
                Velg hentedato
              </label>
              
              {availableDates.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableDates.map(({ date, display }) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setPickupDate(date)}
                      className={`relative p-3 text-sm rounded-lg border-2 transition-all duration-200 ${
                        pickupDate === date
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <span className="block font-medium">{display}</span>
                      {pickupDate === date && (
                        <div className="absolute top-1 right-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      Ingen tilgjengelige datoer i løpet av de neste 7 dagene
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500 mr-2" />
                Velg hentetid
              </label>
              
              <div className="relative">
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="">Velg en tid</option>
                  {availablePickupTimes.map((time: string) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {availablePickupTimes.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      {!restaurantDetails?.openingHours ? "Restaurantens åpningstider er ikke tilgjengelige" :
                        !isDateOpen(pickupDate) ? "Restauranten er stengt på valgt dato" :
                        "Ingen tilgjengelige hentetider for valgt dato"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 