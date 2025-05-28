"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  deliveryLocation: { lat: number; lng: number }
  pickupAddress: string
  deliveryAddress: string
}

export function MapComponent({ deliveryLocation, pickupAddress, deliveryAddress }: MapComponentProps) {
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
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current).setView([deliveryLocation.lat, deliveryLocation.lng], 15)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstanceRef.current)

        // Add delivery partner marker
        markerRef.current = L.marker([deliveryLocation.lat, deliveryLocation.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup("Delivery Partner Location")
          .openPopup()

        // Add pickup and delivery markers
        L.marker([deliveryLocation.lat + 0.005, deliveryLocation.lng + 0.005])
          .addTo(mapInstanceRef.current)
          .bindPopup(`Pickup: ${pickupAddress}`)

        L.marker([deliveryLocation.lat - 0.005, deliveryLocation.lng - 0.005])
          .addTo(mapInstanceRef.current)
          .bindPopup(`Delivery: ${deliveryAddress}`)
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
      markerRef.current.setLatLng([deliveryLocation.lat, deliveryLocation.lng])
      mapInstanceRef.current.setView([deliveryLocation.lat, deliveryLocation.lng], 15)
    }
  }, [deliveryLocation])

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
