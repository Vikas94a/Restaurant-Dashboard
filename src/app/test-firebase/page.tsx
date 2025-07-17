"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function TestFirebase() {
  const [status, setStatus] = useState<string>("Testing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        setStatus("Testing Firebase configuration...");
        
        // Test 1: Check if Firebase is initialized
        if (!auth) {
          throw new Error("Firebase auth is not initialized");
        }
        setStatus("✅ Firebase auth initialized");

        // Test 2: Check environment variables
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        };

        if (!config.apiKey || !config.authDomain || !config.projectId) {
          throw new Error("Firebase environment variables are not set");
        }
        setStatus("✅ Environment variables are set");

        // Test 3: Try to create a test user (this will fail but we can see the error)
        setStatus("Testing user creation...");
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = "testpassword123";
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          setStatus("✅ User creation works");
          
          // Test 4: Try to send verification email
          setStatus("Testing email verification...");
          await sendEmailVerification(userCredential.user, {
            url: `${window.location.origin}/verify-email`,
            handleCodeInApp: false,
          });
          setStatus("✅ Email verification works");
          
          // Clean up: delete the test user
          await userCredential.user.delete();
          setStatus("✅ Test completed successfully - Firebase is working!");
          
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            setStatus("✅ User creation works (email already exists)");
          } else if (authError.code === 'auth/operation-not-allowed') {
            setError("❌ Email/Password authentication is not enabled in Firebase console");
          } else {
            setError(`❌ Authentication error: ${authError.code} - ${authError.message}`);
          }
        }

      } catch (err: any) {
        setError(`❌ Firebase test failed: ${err.message}`);
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Firebase Test</h1>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-blue-800">{status}</p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
            <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}</p>
            <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 