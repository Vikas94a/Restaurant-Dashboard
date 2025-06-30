"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, onIdTokenChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/store/features/authSlice'; // Renamed to avoid conflict
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter and usePathname

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// Define public paths that do not require authentication or email verification
const PUBLIC_PATHS = ['/login', '/signup', '/verify-email'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const clearPersistedData = () => {
      localStorage.removeItem('persist:root');
      sessionStorage.clear();
      // Potentially add more specific keys if needed
    };

    const handleUserSession = async (currentUser: FirebaseUser | null) => {
      if (!currentUser) {
        console.log('No user signed in.');
        clearPersistedData();
        dispatch(logoutAction());
        setUser(null);
        // If not on a public path and not logged in, redirect to login
        if (!PUBLIC_PATHS.includes(pathname) && pathname !== '/') { // Allow access to home page for non-logged in users
          // router.push('/login'); // Commented out to allow access to homepage if not logged in
        }
      } else {
        try {
          console.log('User signed in:', currentUser.uid, 'Email verified:', currentUser.emailVerified);
          await currentUser.getIdToken(true); // Force token refresh & session validation
          setUser(currentUser);

          if (!currentUser.emailVerified && !PUBLIC_PATHS.includes(pathname)) {
            console.log('User email not verified. Redirecting to /verify-email.');
            toast.info("Please verify your email to continue.");
            router.push('/verify-email');
          } else if (currentUser.emailVerified && pathname === '/verify-email') {
            // If email is verified and user is on verify-email page, redirect them away
            console.log('Email verified and on /verify-email page. Redirecting to home.');
            router.push('/'); // Or to a dashboard page
          }
          // If user is verified and on a public path like /login or /signup, redirect to home
          else if (currentUser.emailVerified && (pathname === '/login' || pathname === '/signup')) {
            console.log('User verified and on login/signup page. Redirecting to home.');
            router.push('/');
          }

        } catch (error) {
          console.error('Session validation or token refresh failed:', error);
          await signOut(auth); // Sign out the user
          clearPersistedData();
          dispatch(logoutAction());
          setUser(null);
          toast.error('Your session has expired. Please sign in again.');
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/login');
          }
        }
      }
      setLoading(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, handleUserSession);

    const unsubscribeToken = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Existing token refresh logic
        try {
          const decodedToken = await currentUser.getIdTokenResult();
          const expirationTime = new Date(decodedToken.expirationTime).getTime();
          const currentTime = new Date().getTime();
          
          if (expirationTime - currentTime < 5 * 60 * 1000) { // 5 minutes
            console.log('Token is about to expire, refreshing...');
            await currentUser.getIdToken(true);
            console.log('Token refreshed successfully.');
          }
          // After token refresh, re-check email verification status as it might have changed
          // This is particularly useful if the user verifies their email in another tab
          // and the onAuthStateChanged hasn't picked it up yet immediately.
          if (auth.currentUser) { // Check if currentUser is still available
             await auth.currentUser.reload(); // Get the latest user state
             const freshUser = auth.currentUser;
             if (freshUser && freshUser.emailVerified && !PUBLIC_PATHS.includes(pathname) && pathname === '/verify-email') {
                console.log('Token refreshed, email now verified. Redirecting from /verify-email.');
                router.push('/');
             } else if (freshUser && !freshUser.emailVerified && !PUBLIC_PATHS.includes(pathname)) {
                console.log('Token refreshed, email still not verified. Ensuring redirection to /verify-email.');
                router.push('/verify-email');
             }
             setUser(freshUser); // Update user state
          }

        } catch (error) {
          console.error('Error refreshing token or subsequent check:', error);
          await signOut(auth);
          clearPersistedData();
          dispatch(logoutAction());
          setUser(null);
          toast.error('Your session has expired or is invalid. Please sign in again.');
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/login');
          }
        }
      }
    });

    // Initial loading timeout (optional, helps prevent infinite loading state on weird edge cases)
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Auth state timeout - setting loading to false');
        setLoading(false);
        // If still loading and no user, and not on a public path, consider redirecting
        // This depends on desired behavior for initial load errors.
      }
    }, 5000); // Increased timeout slightly

    return () => {
      console.log('Cleaning up auth listeners.');
      unsubscribeAuth();
      unsubscribeToken();
      clearTimeout(timeoutId);
    };
  }, [dispatch, router, pathname]); // Add router and pathname to dependency array

  // While loading, you might want to render a loading spinner globally or nothing
  // if (loading) {
  //   return <div className="min-h-screen flex items-center justify-center"><p>Loading authentication...</p></div>;
  // }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);