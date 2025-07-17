import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Hentetid</h3>
          <p className="text-sm text-gray-600">Velg når du vil hente bestillingen</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* ASAP Option */}
        {isAsapAvailable && (
          <div
            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              pickupOption === 'asap' 
                ? 'border-orange-500 bg-orange-50 shadow-md' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
            }`}
            onClick={() => handleOptionChange('asap')}
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
                  Bestillingen din vil være klar om 15-20 minutter
                </p>
              </div>
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-orange-600" />
              </div>
            </div>
          </div>
        )}

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
                Velg en spesifikk tid som passer deg
              </p>
            </div>
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendar} className="w-3 h-3 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Time Selection for Later */}
        {pickupOption === 'later' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500 mr-2" />
                Velg hentetid
              </label>
              
              {availableLaterTimes.length > 0 ? (
                <div className="relative">
                  <select
                    value={formData.pickupTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none appearance-none cursor-pointer"
                    required
                  >
                    {formData.pickupTime === '' && (
                      <option value="">Velg en tid</option>
                    )}
                    {availableLaterTimes.map((time) => (
                      <option key={time} value={time}>{time}</option>
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
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      {!todayHours ? "Restaurantens åpningstider er ikke tilgjengelige." :
                        todayHours.closed ? "Restauranten er stengt i dag." :
                          now < openingTime ? `Restauranten åpner kl. ${todayHours.open}.` :
                            "Ingen tilgjengelige hentetider for senere i dag."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Options Available */}
        {!isAsapAvailable && availableLaterTimes.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Ingen hentetider tilgjengelige</p>
                <p className="text-xs">
                  {!todayHours ? "Restaurantens åpningstider er ikke tilgjengelige." :
                    todayHours.closed ? "Restauranten er stengt i dag." :
                      nowWithBuffer < openingTime ? `Restauranten åpner kl. ${todayHours.open}.` :
                        "Ingen tilgjengelige hentetider i dag. Vennligst prøv igjen senere."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupTimeSelector;
