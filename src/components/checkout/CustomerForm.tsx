import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { CustomerFormData } from '@/types/checkout';

interface CustomerFormProps {
  formData: CustomerFormData;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Kontaktinformasjon</h3>
        <p className="text-sm text-gray-600 mt-1">Vennligst oppgi dine detaljer for bestillingsbekreftelse</p>
      </div>

      {/* Name Field */}
      <div className="group">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-orange-500 mr-2" />
          Fullt navn
        </label>
        <div className="relative">
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none placeholder-gray-400 hover:border-gray-300"
            placeholder="Skriv ditt fulle navn"
            required
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" />
          </div>
        </div>
      </div>

      {/* Phone Field */}
      <div className="group">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-orange-500 mr-2" />
          Telefonnummer
        </label>
        <div className="relative">
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none placeholder-gray-400 hover:border-gray-300"
            placeholder="Skriv ditt telefonnummer"
            required
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" />
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div className="group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-orange-500 mr-2" />
          E-postadresse
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none placeholder-gray-400 hover:border-gray-300"
            placeholder="Skriv din e-postadresse"
            required
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" />
          </div>
        </div>
      </div>

      {/* Special Instructions Field */}
      <div className="group">
        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
          Spesielle instruksjoner (valgfritt)
        </label>
        <textarea
          id="specialInstructions"
          value={formData.specialInstructions || ''}
          onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none placeholder-gray-400 hover:border-gray-300 resize-none"
          placeholder="Eventuelle spesielle ønsker eller allergier..."
          rows={3}
        />
      </div>

      {/* Form Footer */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-start">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
            <FontAwesomeIcon icon={faEnvelope} className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="text-sm text-orange-800">
            <p className="font-medium mb-1">Bestillingsbekreftelse</p>
            <p className="text-xs leading-relaxed mb-2">
              Vi sender din bestillingsbekreftelse og hentedetaljer til e-postadressen du oppgir ovenfor.
            </p>
            <p className="text-xs leading-relaxed">
              Ved å legge inn bestilling godtar du vår{' '}
              <a 
                href="/personvern" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-orange-900 transition-colors font-medium"
              >
                personvernerklæring
              </a>
              {' '}og samtykker til behandling av dine personlige opplysninger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
