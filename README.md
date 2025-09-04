# AI Eat Easy

A comprehensive restaurant management platform built with Next.js 15 and Firebase, enabling restaurant owners to manage their business and customers to place orders and make reservations seamlessly. The platform features real-time order tracking, table reservation system, automated email notifications, and a modern responsive interface.

## 🚀 Features

### For Restaurant Owners

- 🏪 **Restaurant Dashboard** - Complete business management interface
- 🍽️ **Advanced Menu Management** - Create, edit, and organize menu items with categories
- 📊 **Real-time Order Tracking** - Live updates on incoming orders
- 📅 **Table Reservation Management** - Manage customer reservations with calendar view
- ⏰ **Business Hours Configuration** - Set opening/closing times for each day
- 📧 **Automated Email System** - Order confirmations and customer feedback emails
- 🎨 **Restaurant Profile Setup** - Complete business information management
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔧 **Reusable Menu Components** - Create reusable extra groups and items

### For Customers

- 🛒 **Smart Shopping Cart** - Add items with customizations and special instructions
- ⏰ **Flexible Pickup Options** - Choose ASAP or schedule for later with restaurant timing integration
- 📅 **Table Reservations** - Book tables with calendar view and restaurant timing validation
- 💳 **Seamless Checkout** - User-friendly order placement process
- 📱 **Order Status Tracking** - Real-time updates on order progress
- 📧 **Email Notifications** - Order confirmations and feedback requests
- 🕐 **Restaurant Timing Integration** - Pickup times and reservations respect actual restaurant hours

### Advanced Features

- 🔐 **Secure Authentication** - Firebase Authentication with email verification
- 🚨 **Session Management** - Automatic session warnings and secure logout
- 📊 **Redux State Management** - Persistent cart and optimized state handling
- 🌙 **Route Protection** - Role-based access control with authentication guards
- 📧 **Automated Feedback System** - Scheduled emails 2 minutes after pickup time
- 🕐 **Smart Timing Logic** - Restaurant hours integration for orders and reservations
- 📅 **Reservation System** - Full calendar view with time slot management
- 🔒 **Firestore Security Rules** - Restaurant-specific data isolation with subcollections

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Backend**: Firebase (Firestore, Authentication, Functions, Hosting)
- **State Management**: Redux Toolkit with Redux Persist
- **Email Service**: Resend API with automated scheduling
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React and FontAwesome
- **Notifications**: Sonner Toast
- **Testing**: Jest with React Testing Library

## 📁 Project Structure

```
ai-eat-easy/
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts             # Email automation & feedback scheduling
│   └── package.json
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (customer)/         # Customer-facing routes
│   │   │   ├── checkout/       # Checkout process
│   │   │   └── reserve/        # Table reservation system
│   │   ├── dashboard/          # Restaurant owner dashboard
│   │   │   ├── menu/          # Menu management
│   │   │   ├── orders/        # Order management
│   │   │   ├── reservations/  # Reservation management
│   │   │   ├── overview/      # Restaurant setup
│   │   │   └── settings/      # Restaurant configuration
│   │   ├── api/               # API routes
│   │   │   ├── feedback/      # Feedback handling
│   │   │   └── send-email/    # Email sending service
│   │   └── restaurant/        # Public restaurant pages
│   │       └── [id]/          # Dynamic restaurant routes
│   ├── components/            # Reusable UI components
│   │   ├── auth/             # Authentication components
│   │   ├── checkout/         # Checkout flow components
│   │   ├── reservation/      # Reservation system components
│   │   ├── dashboardcomponent/ # Dashboard-specific components
│   │   ├── feedback/         # Feedback system components
│   │   ├── menu/             # Menu display components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   │   ├── menu/             # Menu-specific hooks
│   │   ├── useRestaurantTiming.ts # Restaurant timing logic
│   │   └── useReservationTiming.ts # Reservation timing logic
│   ├── providers/            # Context providers and guards
│   │   └── guards/           # Route protection guards
│   ├── services/             # External service integrations
│   │   ├── email/            # Email service logic
│   │   ├── feedback/         # Feedback service logic
│   │   └── reservationService.ts # Reservation management
│   ├── store/                # Redux store configuration
│   │   ├── features/         # Redux slices
│   │   └── middleware/       # Custom middleware
│   ├── types/                # TypeScript type definitions
│   │   ├── checkout.ts       # Checkout types
│   │   └── reservation.ts    # Reservation types
│   └── utils/                # Utility functions
├── firebase.json               # Firebase configuration
└── firestore.rules            # Firestore security rules
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Firebase project** with Firestore, Authentication, and Functions enabled
- **Resend account** for email services

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd ai-eat-easy
```

2. **Install dependencies:**

```bash
npm install
```

3. **Install Firebase Functions dependencies:**

```bash
cd functions
npm install
cd ..
```

4. **Set up environment variables:**

Create `.env.local` in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Server-side only)
RESEND_API_KEY=your_resend_api_key

# OpenAI API Key for AI Marketing Post Generation (Server-side only)
OPENAI_API_KEY=your_openai_api_key_here
```

5. **Configure Firebase:**

```bash
firebase login
firebase use --add  # Select your Firebase project
```

6. **Set Firebase Functions environment variables:**

```bash
firebase functions:config:set resend.api_key="your_resend_api_key"
firebase functions:config:set app.url="http://localhost:3000"
```

### Development

1. **Start the development server:**

```bash
npm run dev
```

2. **Start Firebase emulators (optional):**

```bash
firebase emulators:start
```

3. **Deploy Firebase Functions:**

```bash
cd functions
npm run build
firebase deploy --only functions
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Key Features Implementation

### Authentication System

- **Email/Password authentication** with Firebase Auth
- **Email verification** required for account activation
- **Session management** with automatic warnings before expiration
- **Route protection** with AuthGuard and ProfileCompletionGuard
- **Automatic redirects** based on authentication state

### Restaurant Management

- **Complete restaurant profile** setup with business details
- **Operating hours configuration** with day-specific settings
- **Menu management** with categories, items, and customizations
- **Real-time order tracking** with status updates
- **Table reservation management** with calendar view
- **Dashboard analytics** and business overview

### Customer Ordering System

- **Interactive menu browsing** with item customizations
- **Smart shopping cart** with persistent storage
- **Flexible pickup scheduling** (ASAP or scheduled) with restaurant timing integration
- **Real-time order status** tracking
- **Email notifications** for order updates

### Table Reservation System

- **Full calendar view** for date selection
- **Time slot management** with restaurant timing integration
- **Restaurant hours validation** for availability
- **Customer information collection** with special requests
- **Reservation management** in restaurant dashboard
- **Email confirmations** for reservations

### Email Automation System

- **Order confirmation emails** sent immediately upon acceptance
- **Feedback request emails** sent 2 minutes after pickup time
- **Reservation confirmation emails** for table bookings
- **Automated scheduling** using Firebase Cloud Functions
- **Professional email templates** with order/reservation details
- **Error handling and retry logic**

## ⚙️ Important Configuration Details

### Time Format Requirements

**Restaurant Hours:**

- Must be in 24-hour format (HH:mm)
- Examples: "09:00", "14:30", "23:00"
- Validation pattern: `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$`

**Pickup Time Management:**

- **ASAP orders:** 30-minute buffer from current time
- **Scheduled orders:** 30-minute intervals, up to 7 days ahead
- **Time slots:** Only generated for open days
- **Display format:** 12-hour format with AM/PM for customers
- **Restaurant timing integration:** Respects actual opening hours

**Reservation Time Management:**

- **Time slots:** Generated based on restaurant opening hours
- **Interval configuration:** Customizable (15, 30, 45, 60 minutes)
- **Past time prevention:** Cannot book times that have passed
- **Restaurant hours validation:** Only available during operating hours

### Email System Configuration

**Sender Address:** `AI Eat Easy <onboarding@resend.dev>`  
**Feedback Timing:** 2 minutes after pickup time  
**Email Templates:** Professional HTML with order/reservation details  
**Error Handling:** Automatic retry and failure tracking

### Firebase Collections Structure

```
restaurants/
  {restaurantId}/
    orders/
      {orderId}/
        - customerDetails
        - items[]
        - status
        - pickupTime
        - estimatedPickupTime
    reservations/
      {reservationId}/
        - customerDetails
        - reservationDetails
        - status
        - createdAt
        - updatedAt
    menu/
      {menuItemId}/
        - name, price, description
        - categories, extras
    reusableExtraGroups/
      {groupId}/
        - name, items[]
    reusableExtras/
      {extraId}/
        - name, price, type

scheduledTasks/
  {taskId}/
    - type: 'feedbackEmail'
    - orderId
    - restaurantId
    - scheduledFor
    - status
```

## 🧪 Development & Testing

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code consistency
- **Functional components** with hooks
- **Custom hooks** for reusable logic
- **Error boundaries** and proper error handling

### Testing

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Building for Production

```bash
npm run build         # Build Next.js app
npm run start         # Start production server
```

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy
```

### Deploy Functions Only

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Hosting Only

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

## 🛡️ Security Features

- **Environment variable protection** for sensitive keys
- **Firestore security rules** for data access control with restaurant-specific subcollections
- **Route protection** with authentication guards
- **Input validation** with Zod schemas
- **XSS protection** with proper data sanitization
- **Restaurant data isolation** with subcollection structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Authentication Issues:**

- Ensure Firebase Auth is properly configured
- Check environment variables
- Verify email verification is enabled

**Email Not Sending:**

- Check Resend API key configuration
- Verify Firebase Functions environment variables
- Check function logs: `firebase functions:log`

**Order Not Updating:**

- Check Firestore security rules
- Verify restaurant ID is correct
- Check Redux state management

**Reservation Issues:**

- Verify restaurant opening hours are set
- Check Firestore security rules for reservations subcollection
- Ensure reservation settings are properly configured

### Getting Help

For support or questions:

- Check the Firebase console for error logs
- Review the browser console for client-side errors
- Use `firebase functions:log` for server-side debugging

---

**Built with ❤️ using Next.js, Firebase, and modern web technologies.**