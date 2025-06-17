"use client";

import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RootState, AppDispatch } from '@/store/store';
import { showLogoutWarningModal, resetAutoLogoutTimer, logout } from '@/store/features/authSlice';

export function SessionWarningModal() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLogoutWarningModalVisible, warningTimerRemaining } = useSelector(
    (state: RootState) => state.auth
  );

  // Format remaining time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    dispatch(resetAutoLogoutTimer());
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Dialog open={isLogoutWarningModalVisible} onOpenChange={(open) => {
      if (!open) {
        dispatch(showLogoutWarningModal(false));
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTime(warningTimerRemaining)}. Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            Log Out Now
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            className="w-full sm:w-auto"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 