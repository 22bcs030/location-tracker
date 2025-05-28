"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  driverLocation: { lat: number; lng: number }
  destination: { lat: number; lng: number }
}

export function MapComponent({ driverLocation, destination }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      if (typeof window === "undefined") return

      const L = (await import("leaflet")).default

      // Fix for default markers in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !mapInstanceRef.current) {
        // Calculate center point between driver and destination
        const centerLat = (driverLocation.lat + destination.lat) / 2
        const centerLng = (driverLocation.lng + destination.lng) / 2
        
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current).setView([centerLat, centerLng], 13)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstanceRef.current)

        // Create custom delivery icon
        const deliveryIcon = L.divIcon({
          html: `<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                  </svg>
                </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        // Create custom destination icon
        const destinationIcon = L.divIcon({
          html: `<div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="white">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        // Add delivery partner marker
        markerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: deliveryIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Delivery Partner")
          .openPopup();

        // Add destination marker
        L.marker([destination.lat, destination.lng], { icon: destinationIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Delivery Destination");

        // Draw a line between driver and destination
        const polyline = L.polyline([
          [driverLocation.lat, driverLocation.lng],
          [destination.lat, destination.lng]
        ], {
          color: '#4F46E5',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);

        // Adjust bounds to fit both markers
        const bounds = L.latLngBounds([
          [driverLocation.lat, driverLocation.lng],
          [destination.lat, destination.lng]
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    initMap()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update marker position when delivery location changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
      
      // Update the polyline
      if (mapInstanceRef.current && driverLocation && destination) {
        // Remove existing polylines
        mapInstanceRef.current.eachLayer((layer: any) => {
          if (layer instanceof (window as any).L.Polyline) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
        
        // Add updated polyline
        const L = (window as any).L;
        if (L) {
          L.polyline([
            [driverLocation.lat, driverLocation.lng],
            [destination.lat, destination.lng]
          ], {
            color: '#4F46E5',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10',
            lineJoin: 'round'
          }).addTo(mapInstanceRef.current);
        }
      }
    }
  }, [driverLocation, destination])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
