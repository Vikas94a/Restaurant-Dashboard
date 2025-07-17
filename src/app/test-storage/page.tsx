"use client";

import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";

export default function TestStorage() {
  const [status, setStatus] = useState<string>("Ready to test");
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const testStorage = async () => {
    try {
      setStatus("Testing Firebase storage configuration...");
      setError(null);

      // Test 1: Check if storage is initialized
      if (!storage) {
        throw new Error("Firebase storage is not initialized");
      }
      setStatus("✅ Storage initialized");

      // Test 2: Check environment variables
      const config = {
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      };

      if (!config.storageBucket || !config.projectId) {
        throw new Error("Firebase storage environment variables are not set");
      }
      setStatus("✅ Environment variables are set");

      // Test 3: Create a test file
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      setStatus("Testing file upload...");
      
      // Test 4: Try to upload a test file
      const testId = `test-${Date.now()}`;
      const storageRef = ref(storage, `test/${testId}/test.txt`);
      
      const snapshot = await uploadBytes(storageRef, testFile);
      setStatus("✅ File upload successful");
      
      // Test 5: Get download URL
      const url = await getDownloadURL(snapshot.ref);
      setUploadedUrl(url);
      setStatus("✅ Download URL generated successfully");
      
      setStatus("🎉 All storage tests passed! Firebase storage is working correctly.");
      
    } catch (err: any) {
      setError(`❌ Storage test failed: ${err.message}`);
      setStatus("❌ Test failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Firebase Storage Test</h1>
        
        <div className="space-y-4">
          <Button 
            onClick={testStorage}
            className="w-full"
            disabled={status.includes("Testing")}
          >
            {status.includes("Testing") ? "Testing..." : "Test Storage"}
          </Button>
          
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-blue-800">{status}</p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {uploadedUrl && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-green-800 font-semibold">Uploaded File URL:</p>
              <p className="text-green-700 text-sm break-all">{uploadedUrl}</p>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p><strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Not set'}</p>
            <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 