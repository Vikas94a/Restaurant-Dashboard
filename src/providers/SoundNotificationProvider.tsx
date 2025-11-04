"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeUp, faVolumeMute, faPlay } from "@fortawesome/free-solid-svg-icons";

interface SoundNotificationContextType {
  soundEnabled: boolean;
  isPlaying: boolean;
  isReservationSoundPlaying: boolean;
  toggleSound: () => void;
  testSound: () => void;
  startRepeatingSound: () => void;
  stopRepeatingSound: () => void;
  startRepeatingReservationSound: () => void;
  stopRepeatingReservationSound: () => void;
  SoundControls: React.ComponentType;
  debugAudio: () => void;
}

const SoundNotificationContext = createContext<SoundNotificationContextType | undefined>(undefined);

export const useSoundNotification = () => {
  const context = useContext(SoundNotificationContext);
  if (!context) {
    throw new Error('useSoundNotification must be used within a SoundNotificationProvider');
  }
  return context;
};

interface SoundNotificationProviderProps {
  children: React.ReactNode;
}

export const SoundNotificationProvider: React.FC<SoundNotificationProviderProps> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReservationSoundPlaying, setIsReservationSoundPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reservationAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reservationSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio for orders
  useEffect(() => {
    audioRef.current = new Audio('/sound/bell-notification.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.loop = false;
    
    // Initialize audio for reservations
    reservationAudioRef.current = new Audio('/sound/reservation-notification.mp3');
    reservationAudioRef.current.volume = 0.7;
    reservationAudioRef.current.loop = false;
    
    // Cleanup on unmount
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
      if (reservationSoundIntervalRef.current) {
        clearInterval(reservationSoundIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (reservationAudioRef.current) {
        reservationAudioRef.current.pause();
        reservationAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const startRepeatingSound = () => {
    if (!audioRef.current || !soundEnabled) {
      return;
    }
    
    setIsPlaying(true);
    // Play the sound immediately
    audioRef.current.play().catch(error => {
      });
    
    // Set up interval to play sound every 3 seconds
    soundIntervalRef.current = setInterval(() => {
      if (audioRef.current && soundEnabled) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          });
      }
    }, 3000);
  };

  const stopRepeatingSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const startRepeatingReservationSound = () => {
    if (!reservationAudioRef.current || !soundEnabled) {
      return;
    }
    
    setIsReservationSoundPlaying(true);
    // Play the sound immediately
    reservationAudioRef.current.play().catch(error => {
      console.error('Failed to play reservation sound:', error);
    });
    
    // Set up interval to play sound every 3 seconds
    reservationSoundIntervalRef.current = setInterval(() => {
      if (reservationAudioRef.current && soundEnabled) {
        reservationAudioRef.current.currentTime = 0;
        reservationAudioRef.current.play().catch(error => {
          console.error('Failed to play reservation sound:', error);
        });
      }
    }, 3000);
  };

  const stopRepeatingReservationSound = () => {
    if (reservationSoundIntervalRef.current) {
      clearInterval(reservationSoundIntervalRef.current);
      reservationSoundIntervalRef.current = null;
    }
    if (reservationAudioRef.current) {
      reservationAudioRef.current.pause();
      reservationAudioRef.current.currentTime = 0;
    }
    setIsReservationSoundPlaying(false);
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    if (!newSoundEnabled) {
      if (isPlaying) {
        stopRepeatingSound();
      }
      if (isReservationSoundPlaying) {
        stopRepeatingReservationSound();
      }
    }
    
    toast.info(newSoundEnabled ? '🔊 Lyd påslått' : '🔇 Lyd avslått');
  };

  const testSound = () => {
    if (!soundEnabled) {
      toast.error('Lyd er avslått. Vennligst slå på lyd først.');
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        toast.error('Kunne ikke spille av testlyd');
      });
    } else {
      toast.error('Audio reference not available');
    }
  };

  // Debug function to check audio file
  const debugAudio = () => {
    if (audioRef.current) {
      }
  };

  // Sound Controls Component
  const SoundControls: React.FC = () => (
    <div className="flex items-center space-x-2">
      {/* Sound Toggle Button */}
      <button
        onClick={toggleSound}
        className={`p-2 rounded-lg transition-all duration-200 ${
          soundEnabled 
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={soundEnabled ? 'Slå av lyd' : 'Slå på lyd'}
      >
        <FontAwesomeIcon 
          icon={soundEnabled ? faVolumeUp : faVolumeMute} 
          className="w-4 h-4" 
        />
      </button>

      {/* Test Sound Button */}
      <button
        onClick={testSound}
        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
        title="Test lyd"
      >
        <FontAwesomeIcon icon={faPlay} className="w-4 h-4" />
      </button>

      {/* Playing Indicators */}
      {isPlaying && (
        <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-lg animate-pulse">
          <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-ping"></div>
          <span className="text-xs font-medium">Bestilling lyd...</span>
        </div>
      )}
      {isReservationSoundPlaying && (
        <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-lg animate-pulse">
          <div className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-ping"></div>
          <span className="text-xs font-medium">Reservasjon lyd...</span>
        </div>
      )}
    </div>
  );

  const value: SoundNotificationContextType = {
    soundEnabled,
    isPlaying,
    isReservationSoundPlaying,
    toggleSound,
    testSound,
    startRepeatingSound,
    stopRepeatingSound,
    startRepeatingReservationSound,
    stopRepeatingReservationSound,
    SoundControls,
    debugAudio,
  };

  return (
    <SoundNotificationContext.Provider value={value}>
      {children}
    </SoundNotificationContext.Provider>
  );
}; 