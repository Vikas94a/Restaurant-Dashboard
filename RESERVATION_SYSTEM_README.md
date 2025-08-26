# Restaurant Reservation System

This document describes the comprehensive reservation system implemented for the restaurant dashboard application.

## 🏗️ System Architecture

### 1. **Data Structure**
- **Reservation Types**: Comprehensive TypeScript interfaces for reservations, settings, and availability
- **Firestore Schema**: Structured data storage for restaurants, reservations, and settings
- **Real-time Updates**: Live reservation management and status updates

### 2. **Core Components**
- **Reservation Service**: Backend logic for all reservation operations
- **Customer Reservation Page**: Public-facing booking interface
- **Dashboard Management**: Restaurant staff interface for managing reservations
- **Custom Hooks**: React hooks for state management and API calls

## 🚀 Features

### **For Customers:**
- ✅ **Easy Booking**: Simple date/time selection with real-time availability
- ✅ **Party Size Selection**: Configurable minimum/maximum party sizes
- ✅ **Contact Information**: Name, email, phone, and special requests
- ✅ **Instant Confirmation**: Real-time booking confirmation
- ✅ **Mobile Responsive**: Works perfectly on all devices

### **For Restaurant Staff:**
- ✅ **Reservation Management**: View, confirm, cancel, and complete reservations
- ✅ **Real-time Updates**: Live status changes and notifications
- ✅ **Settings Configuration**: Customize booking rules and availability
- ✅ **Dashboard Integration**: Seamless integration with existing restaurant dashboard

### **System Features:**
- ✅ **Conflict Prevention**: Prevents double-bookings and scheduling conflicts
- ✅ **Availability Checking**: Real-time time slot availability
- ✅ **Flexible Scheduling**: Configurable time slots and duration
- ✅ **Advance Booking Limits**: Set maximum days in advance for bookings

## 📁 File Structure

```
src/
├── types/
│   └── reservation.ts              # Reservation type definitions
├── services/
│   └── reservationService.ts       # Backend reservation logic
├── hooks/
│   └── useReservations.ts          # Custom React hooks
├── components/dashboardcomponent/reservations/
│   ├── ReservationList.tsx         # Dashboard reservation management
│   └── index.ts                    # Component exports
├── app/
│   ├── (customer)/reserve/[domain]/
│   │   └── page.tsx                # Customer reservation page
│   ├── dashboard/reservations/
│   │   └── page.tsx                # Restaurant dashboard
│   └── test-reservation/
│       └── page.tsx                # Testing interface
```

## 🛠️ Setup Instructions

### 1. **Enable Reservations in Dashboard**
1. Go to your restaurant dashboard
2. Navigate to "Reservations" section
3. Toggle "Enable Table Reservations" to ON
4. Configure your settings:
   - **Party Size Limits**: Min/max number of people
   - **Advance Booking**: How many days in advance customers can book
   - **Operating Hours**: Opening and closing times
   - **Time Slots**: Interval between available booking times
   - **Capacity**: Maximum reservations per time slot
5. Save your settings

### 2. **Share Your Reservation Link**
- Copy the generated reservation link
- Share it on your website, social media, or Google Business profile
- Customers can use this link to make reservations

### 3. **Manage Reservations**
- View all incoming reservations in the dashboard
- Confirm, cancel, or mark reservations as completed
- Monitor real-time updates and customer requests

## 🔧 Configuration Options

### **Reservation Settings:**
```typescript
interface ReservationSettings {
  enabled: boolean;                    // Enable/disable system
  maxPartySize: number;                // Maximum party size (e.g., 10)
  minPartySize: number;                // Minimum party size (e.g., 1)
  advanceBookingDays: number;          // Days in advance (e.g., 30)
  openingTime: string;                 // Opening time (e.g., "11:00")
  closingTime: string;                 // Closing time (e.g., "22:00")
  reservationDuration: number;         // Duration in minutes (e.g., 90)
  maxReservationsPerTimeSlot: number;  // Max bookings per slot (e.g., 3)
  timeSlotInterval: number;            // Minutes between slots (e.g., 30)
}
```

### **Time Slot Generation:**
- System automatically generates available time slots
- Slots are created based on your opening/closing times
- Interval between slots is configurable (15, 30, 45, or 60 minutes)
- Each time slot can accommodate multiple reservations

## 🌐 Customer Experience

### **Reservation Flow:**
1. **Landing Page**: Customer visits your reservation link
2. **Date Selection**: Choose from available dates (within advance booking limit)
3. **Time Selection**: Pick from available time slots
4. **Party Size**: Select number of people (within your limits)
5. **Contact Info**: Enter name, email, phone, and special requests
6. **Confirmation**: Instant booking confirmation with reservation details

### **URL Structure:**
```
https://yourdomain.com/reserve/[restaurant-domain]
```
Example: `https://aieateasy.no/reserve/italian-restaurant`

## 📊 Dashboard Management

### **Reservation Statuses:**
- **Pending**: New reservation awaiting confirmation
- **Confirmed**: Reservation confirmed by restaurant
- **Cancelled**: Reservation cancelled (by customer or restaurant)
- **Completed**: Customer has dined and left
- **No-show**: Customer didn't arrive

### **Management Actions:**
- **View Details**: See full customer and reservation information
- **Confirm**: Accept and confirm a reservation
- **Cancel**: Cancel a reservation with optional notes
- **Mark Complete**: Update status when customer finishes dining

## 🧪 Testing

### **Test Page:**
Visit `/test-reservation` to test the system:
1. Enter your restaurant ID
2. Test availability checking
3. Test reservation creation
4. Monitor console logs for detailed information

### **Testing Checklist:**
- [ ] Enable reservations in dashboard
- [ ] Test customer reservation page
- [ ] Verify availability checking
- [ ] Test reservation creation
- [ ] Check dashboard management
- [ ] Test status updates
- [ ] Verify conflict prevention

## 🔒 Security & Validation

### **Data Validation:**
- Party size limits enforcement
- Advance booking date validation
- Time slot availability checking
- Required field validation
- Conflict detection and prevention

### **Access Control:**
- Customer pages are public (no authentication required)
- Dashboard access requires restaurant staff authentication
- Reservation data is isolated by restaurant ID

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Reservations Unavailable"**
   - Check if reservations are enabled in dashboard
   - Verify restaurant settings are saved

2. **"Time Slot Not Available"**
   - Check operating hours configuration
   - Verify time slot interval settings
   - Check if slot is at capacity

3. **"Advance Booking Limit"**
   - Adjust advance booking days in settings
   - Check if requested date is within limit

4. **"Restaurant Not Found"**
   - Verify domain configuration
   - Check if restaurant exists in database

### **Debug Steps:**
1. Check browser console for error messages
2. Verify Firestore rules allow read/write access
3. Check restaurant ID and domain configuration
4. Test with the `/test-reservation` page

## 🔮 Future Enhancements

### **Planned Features:**
- **Email Notifications**: Automatic confirmation and reminder emails
- **SMS Integration**: Text message confirmations
- **Calendar Integration**: Google Calendar, Outlook sync
- **Table Management**: Assign specific tables to reservations
- **Waitlist System**: Handle overflow when fully booked
- **Analytics Dashboard**: Reservation trends and insights
- **Customer Portal**: Allow customers to modify/cancel bookings

### **Integration Possibilities:**
- **POS Systems**: Sync with point-of-sale systems
- **Third-party Platforms**: OpenTable, Resy integration
- **CRM Systems**: Customer relationship management
- **Marketing Tools**: Email campaigns and promotions

## 📞 Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review console logs and error messages
3. Test with the `/test-reservation` page
4. Contact the development team with specific error details

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
