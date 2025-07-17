# Environment Variables Setup Guide

## Issue Found

The email verification is not working because the Firebase configuration environment variables are not set for your new project `ai-eat-easy`.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Firebase Configuration for ai-eat-easy project
NEXT_PUBLIC_FIREBASE_API_KEY=your_new_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-eat-easy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-eat-easy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-eat-easy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_new_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_new_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_new_measurement_id_here

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
```

## How to Get These Values

1. **Go to Firebase Console**: https://console.firebase.google.com/project/ai-eat-easy/overview
2. **Click on Project Settings** (gear icon)
3. **Scroll down to "Your apps"** section
4. **Click on the web app** or create a new one
5. **Copy the config values** from the provided configuration object

## Steps to Fix

1. Create `.env.local` file in project root
2. Add the environment variables above with your actual values
3. Restart your development server: `npm run dev`
4. Test the signup process again

## Additional Firebase Setup

Make sure your Firebase project has:

- Email/Password authentication enabled
- Email verification enabled
- Proper domain configuration for email verification links

## Testing

After setting up the environment variables:

1. Try signing up with a new email
2. Check if verification email is sent
3. Check browser console for any errors
4. Check Firebase console for authentication logs
