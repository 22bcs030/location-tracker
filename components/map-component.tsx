"use client"

import { useEffect, useRef, useState } from "react"
import type { LatLngExpression, LatLngTuple } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationData } from '@/types/delivery'
import { setupLeafletIcons } from '@/utils/leaflet-setup'

type LocationCoordinates = [number, number] | {lat: number, lng: number}

interface MapComponentProps {
  currentLocation?: LocationData | null
  pickupLocation?: LocationCoordinates
  deliveryLocation?: LocationCoordinates
  locationHistory?: LocationData[]
  height?: string
  showRoute?: boolean
  showHistory?: boolean
  isTracking?: boolean
  zoom?: number
  className?: string
}

export function MapComponent({
  currentLocation,
  pickupLocation,
  deliveryLocation,
  locationHistory = [],
  height = '400px',
  showRoute = true,
  showHistory = false,
  isTracking = false,
  zoom = 14,
  className = '',
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{
    current?: L.Marker
    pickup?: L.Marker
    delivery?: L.Marker
    history: L.Marker[]
    polyline?: L.Polyline
    routePolyline?: L.Polyline
  }>({
    history: [],
  })

  const [isMapInitialized, setIsMapInitialized] = useState(false)

  // Setup Leaflet icons
  useEffect(() => {
    setupLeafletIcons()
  }, [])

  // Create custom marker icons
  const createDriverIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </div>
          ${isTracking ? '<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>' : ''}
        </div>
      `,
      className: 'driver-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  const createPickupIcon = () => {
    return L.divIcon({
      html: `
        <div class="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      className: 'pickup-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })
  }

  const createDeliveryIcon = () => {
    return L.divIcon({
      html: `
        <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 13-3-3 3-3 3 3-3 3Z"></path>
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          </svg>
        </div>
      `,
      className: 'delivery-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })
  }

  const createHistoryIcon = () => {
    return L.divIcon({
      html: `
        <div class="w-2 h-2 bg-primary rounded-full opacity-70"></div>
      `,
      className: 'history-marker-icon',
      iconSize: [8, 8],
      iconAnchor: [4, 4],
    })
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: currentLocation 
        ? [currentLocation.lat, currentLocation.lng]
        : pickupLocation || deliveryLocation || [40.7128, -74.006],
      zoom,
      zoomControl: true,
      attributionControl: false,
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    setIsMapInitialized(true)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markersRef.current = { history: [] }
    }
  }, [currentLocation, pickupLocation, deliveryLocation, zoom])

  // Update markers and routes when locations change
  useEffect(() => {
    if (!mapRef.current || !isMapInitialized) return

    const map = mapRef.current
    const markers = markersRef.current

    // Update current location marker
    if (currentLocation) {
      const latlng: [number, number] = [currentLocation.lat, currentLocation.lng]

      if (markers.current) {
        markers.current.setLatLng(latlng)
      } else {
        markers.current = L.marker(latlng, { icon: createDriverIcon() }).addTo(map)
      }

      // Center map on current location
      if (isTracking) {
        map.panTo(latlng)
      }
    }

    // Update pickup location marker
    if (pickupLocation) {
      // Convert to LatLngTuple if object format
      const pickupLatLng: LatLngTuple = Array.isArray(pickupLocation) 
        ? pickupLocation 
        : [pickupLocation.lat, pickupLocation.lng]

      if (markers.pickup) {
        markers.pickup.setLatLng(pickupLatLng)
      } else {
        markers.pickup = L.marker(pickupLatLng, { icon: createPickupIcon() })
          .addTo(map)
          .bindPopup('Pickup Location')
      }
    }

    // Update delivery location marker
    if (deliveryLocation) {
      // Convert to LatLngTuple if object format
      const deliveryLatLng: LatLngTuple = Array.isArray(deliveryLocation) 
        ? deliveryLocation 
        : [deliveryLocation.lat, deliveryLocation.lng]

      if (markers.delivery) {
        markers.delivery.setLatLng(deliveryLatLng)
      } else {
        markers.delivery = L.marker(deliveryLatLng, { icon: createDeliveryIcon() })
          .addTo(map)
          .bindPopup('Delivery Location')
      }
    }

    // Update route polyline between pickup and delivery
    if (showRoute && pickupLocation && deliveryLocation) {
      // Convert to LatLngTuple if object format
      const pickupLatLng: LatLngTuple = Array.isArray(pickupLocation) 
        ? pickupLocation 
        : [pickupLocation.lat, pickupLocation.lng]
      
      const deliveryLatLng: LatLngTuple = Array.isArray(deliveryLocation) 
        ? deliveryLocation 
        : [deliveryLocation.lat, deliveryLocation.lng]

      if (markers.routePolyline) {
        markers.routePolyline.setLatLngs([pickupLatLng, deliveryLatLng])
      } else {
        markers.routePolyline = L.polyline([pickupLatLng, deliveryLatLng], {
          color: '#6366F1',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
        }).addTo(map)
      }

      // Fit map to show both pickup and delivery
      if (!currentLocation) {
        map.fitBounds([pickupLatLng, deliveryLatLng], { padding: [50, 50] })
      }
    }

    // Update location history trail
    if (showHistory && locationHistory.length > 0) {
      // Clear old history markers
      markers.history.forEach(marker => marker.remove())
      markers.history = []

      // Add new history markers (limited to last 20 points)
      const historyPoints = locationHistory.slice(-20)
      historyPoints.forEach((point, index) => {
        if (index % 3 === 0 && index !== historyPoints.length - 1) { // Show every 3rd point
          const historyMarker = L.marker([point.lat, point.lng], {
            icon: createHistoryIcon(),
          }).addTo(map)
          markers.history.push(historyMarker)
        }
      })

      // Update polyline for location history
      const polylinePoints = historyPoints.map(point => [point.lat, point.lng] as [number, number])
      
      if (markers.polyline) {
        markers.polyline.setLatLngs(polylinePoints)
      } else {
        markers.polyline = L.polyline(polylinePoints, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.6,
        }).addTo(map)
      }
    }

    // Update driver icon to reflect tracking status
    if (markers.current && isTracking !== undefined) {
      markers.current.setIcon(createDriverIcon())
    }
  }, [currentLocation, pickupLocation, deliveryLocation, locationHistory, showRoute, showHistory, isTracking, isMapInitialized])

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full ${className}`} 
      style={{ height }}
      data-testid="map-container"
    />
  )
}
