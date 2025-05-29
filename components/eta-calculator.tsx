"use client"

import { useState, useEffect } from 'react';
import { LocationData } from '@/types/delivery';
import { Clock, Navigation } from 'lucide-react';

interface ETACalculatorProps {
  currentLocation?: LocationData | null;
  destinationLocation?: [number, number];
  averageSpeed?: number; // km/h
  initialETA?: string;
  className?: string;
}

export function ETACalculator({
  currentLocation,
  destinationLocation,
  averageSpeed = 20, // Default average speed: 20 km/h
  initialETA,
  className,
}: ETACalculatorProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(initialETA || null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);

  // Calculate distance using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Calculate ETA based on distance and average speed
  const calculateETA = (distanceKm: number, speedKmh: number): number => {
    return (distanceKm / speedKmh) * 60; // ETA in minutes
  };

  // Format minutes to "X min" or "X hr Y min"
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours} hr ${mins} min`;
    }
  };

  // Calculate arrival time
  const calculateArrivalTime = (etaMinutes: number): string => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + etaMinutes * 60000);
    return arrivalTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Update ETA when location changes
  useEffect(() => {
    if (currentLocation && destinationLocation) {
      const distanceKm = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        destinationLocation[0],
        destinationLocation[1]
      );
      
      setDistance(distanceKm);
      
      const etaMinutes = calculateETA(distanceKm, averageSpeed);
      setEta(formatMinutes(etaMinutes));
      setArrivalTime(calculateArrivalTime(etaMinutes));
    }
  }, [currentLocation, destinationLocation, averageSpeed]);

  if (!eta) {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Estimated arrival:</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{eta}</span>
          {distance !== null && (
            <span className="text-sm text-muted-foreground">
              ({distance.toFixed(1)} km)
            </span>
          )}
        </div>
        
        {arrivalTime && (
          <div className="flex items-center gap-1 text-sm">
            <Navigation className="w-3 h-3" />
            <span>Arrive at {arrivalTime}</span>
          </div>
        )}
      </div>
    </div>
  );
} 