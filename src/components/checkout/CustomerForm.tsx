import React from 'react';
import { CustomerFormData } from '@/types/checkout';

interface CustomerFormProps {
  formData: CustomerFormData;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
          required
        />
      </div>
    </div>
  );
};

export default CustomerForm;
