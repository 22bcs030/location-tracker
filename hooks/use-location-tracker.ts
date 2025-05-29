import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationData } from '@/types/delivery';
import socketService from '@/services/socket';

interface LocationTrackerOptions {
  orderId: string;
  intervalMs?: number;
  enableHighAccuracy?: boolean;
  simulateFallback?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
}

export function useLocationTracker({
  orderId,
  intervalMs = 3000,
  enableHighAccuracy = true,
  simulateFallback = true,
  onLocationUpdate,
}: LocationTrackerOptions) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isCustomerViewing, setIsCustomerViewing] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const initialLocationRef = useRef<LocationData | null>(null);
  
  // Check if geolocation is supported
  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  
  // Get battery level if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // @ts-ignore - getBattery is not in the standard navigator type
      navigator.getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }
  }, []);
  
  // Get current location
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationSupported) {
        if (simulateFallback) {
          // Simulate location if geolocation is not supported
          const simulatedLocation = generateSimulatedLocation();
          resolve(simulatedLocation);
        } else {
          reject(new Error('Geolocation is not supported by this browser.'));
        }
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            altitude: position.coords.altitude || undefined,
          };
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          
          if (simulateFallback) {
            // Fallback to simulated location
            const simulatedLocation = generateSimulatedLocation();
            resolve(simulatedLocation);
          } else {
            reject(error);
          }
        },
        { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [isGeolocationSupported, simulateFallback, enableHighAccuracy]);
  
  // Generate a simulated location
  const generateSimulatedLocation = useCallback((): LocationData => {
    // If we have a current location, simulate movement around it
    if (currentLocation) {
      // Simulate small movement (±0.0005 degrees, roughly 50 meters)
      const latDelta = (Math.random() - 0.5) * 0.001;
      const lngDelta = (Math.random() - 0.5) * 0.001;
      
      return {
        lat: currentLocation.lat + latDelta,
        lng: currentLocation.lng + lngDelta,
        timestamp: new Date().toISOString(),
        accuracy: 50, // Simulated accuracy of 50 meters
        speed: Math.random() * 10, // Random speed between 0-10 m/s
      };
    }
    
    // If no current location, use a default location (New York City)
    // or use the initial location if available
    if (initialLocationRef.current) {
      const latDelta = (Math.random() - 0.5) * 0.001;
      const lngDelta = (Math.random() - 0.5) * 0.001;
      
      return {
        lat: initialLocationRef.current.lat + latDelta,
        lng: initialLocationRef.current.lng + lngDelta,
        timestamp: new Date().toISOString(),
        accuracy: 50,
        speed: Math.random() * 10,
      };
    }
    
    // Default location (NYC)
    return {
      lat: 40.7128 + (Math.random() - 0.5) * 0.01,
      lng: -74.006 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date().toISOString(),
      accuracy: 50,
      speed: Math.random() * 10,
    };
  }, [currentLocation]);
  
  // Start tracking
  const startTracking = useCallback(async () => {
    if (isTracking) return;
    
    try {
      // Get initial location
      const initialLocation = await getCurrentLocation();
      initialLocationRef.current = initialLocation;
      
      // Update state
      setCurrentLocation(initialLocation);
      setLocationHistory([initialLocation]);
      setIsTracking(true);
      setError(null);
      
      // Start socket tracking session
      socketService.startTrackingSession(orderId, initialLocation);
      
      // Update socket location
      socketService.updateLocation(orderId, {
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
      });
      
      // Start socket location updates
      socketService.startLocationUpdates(orderId, intervalMs);
      
      // Start watch position if geolocation is supported
      if (isGeolocationSupported) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              accuracy: position.coords.accuracy,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined,
              altitude: position.coords.altitude || undefined,
            };
            
            setCurrentLocation(newLocation);
            setLocationHistory(prev => [...prev, newLocation]);
            
            // Update socket location
            socketService.updateLocation(orderId, {
              latitude: newLocation.lat,
              longitude: newLocation.lng,
            });
            
            // Call onLocationUpdate callback if provided
            if (onLocationUpdate) {
              onLocationUpdate(newLocation);
            }
          },
          (error) => {
            console.error('Watch position error:', error);
            setError(`Location error: ${error.message}`);
            
            // If geolocation fails, use simulated location updates
            if (simulateFallback && !intervalIdRef.current) {
              startSimulatedUpdates();
            }
          },
          { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
        );
      } else if (simulateFallback) {
        // If geolocation is not supported, use simulated location updates
        startSimulatedUpdates();
      }
      
      // Set up customer viewing check
      const checkViewingInterval = setInterval(() => {
        socketService.checkCustomerViewing(orderId);
      }, 10000); // Check every 10 seconds
      
      // Listen for customer viewing status
      const viewingCallback = (data: { isViewing: boolean }) => {
        setIsCustomerViewing(data.isViewing);
      };
      
      socketService.on('tracking:customer_viewing_status', viewingCallback);
      
      // Clean up function
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        
        clearInterval(checkViewingInterval);
        socketService.off('tracking:customer_viewing_status', viewingCallback);
      };
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError(`Failed to start tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsTracking(false);
    }
  }, [
    isTracking, 
    getCurrentLocation, 
    orderId, 
    intervalMs, 
    isGeolocationSupported, 
    simulateFallback, 
    enableHighAccuracy,
    onLocationUpdate
  ]);
  
  // Start simulated location updates
  const startSimulatedUpdates = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    
    intervalIdRef.current = setInterval(() => {
      const simulatedLocation = generateSimulatedLocation();
      
      setCurrentLocation(simulatedLocation);
      setLocationHistory(prev => [...prev, simulatedLocation]);
      
      // Update socket location
      socketService.updateLocation(orderId, {
        latitude: simulatedLocation.lat,
        longitude: simulatedLocation.lng,
      });
      
      // Call onLocationUpdate callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(simulatedLocation);
      }
    }, intervalMs);
  }, [generateSimulatedLocation, intervalMs, orderId, onLocationUpdate]);
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    
    // Stop watch position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Stop interval updates
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Stop socket location updates
    socketService.stopLocationUpdates(orderId);
    
    // End socket tracking session
    socketService.endTrackingSession(orderId);
    
    setIsTracking(false);
  }, [isTracking, orderId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);
  
  return {
    isTracking,
    currentLocation,
    locationHistory,
    error,
    isGeolocationSupported,
    isCustomerViewing,
    batteryLevel,
    startTracking,
    stopTracking,
  };
} 