'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, reverseGeocode, searchLocation } from '@/lib/googleMaps'

const DEFAULT_COORDS = { lat: 52.4064, lng: 16.9252 } // Poznań

type UseLocationMapProps = {
    initialLocation?: string
}

export const useLocationMap = ({ initialLocation }: UseLocationMapProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    const [isLoadingMap, setIsLoadingMap] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [currentAddress, setCurrentAddress] = useState(initialLocation || '')

    const handleLocationUpdate = async (lat: number, lng: number) => {
        setIsGeocoding(true)
        try {
            const address = await reverseGeocode(lat, lng)
            if (address) {
                setCurrentAddress(address)
            }
        } catch (err) {
            console.error('Reverse geocode failed:', err)
        } finally {
            setIsGeocoding(false)
        }
    }

    useEffect(() => {
        let isMounted = true
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        loadGoogleMaps(apiKey)
            .then((google) => {
                if (!isMounted || !mapContainerRef.current) return

                const center = DEFAULT_COORDS

                const map = new google.maps.Map(mapContainerRef.current, {
                    center,
                    zoom: 14,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    styles: [
                        { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
                    ],
                })

                mapInstanceRef.current = map

                const marker = new google.maps.Marker({
                    position: center,
                    map,
                    draggable: true,
                    title: 'Обрана локація',
                    animation: google.maps.Animation.DROP,
                })
                markerRef.current = marker

                map.addListener('click', (e: any) => {
                    if (!e.latLng) return
                    const lat = e.latLng.lat()
                    const lng = e.latLng.lng()
                    marker.setPosition({ lat, lng })
                    handleLocationUpdate(lat, lng)
                })

                marker.addListener('dragend', (e: any) => {
                    if (!e.latLng) return
                    const lat = e.latLng.lat()
                    const lng = e.latLng.lng()
                    handleLocationUpdate(lat, lng)
                })

                if (initialLocation && initialLocation.trim()) {
                    searchLocation(initialLocation).then((res) => {
                        if (res && isMounted) {
                            map.setCenter({ lat: res.lat, lng: res.lng })
                            map.setZoom(16)
                            marker.setPosition({ lat: res.lat, lng: res.lng })
                            setCurrentAddress(res.label || initialLocation)
                        }
                    })
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            if (!isMounted) return
                            const userCoords = {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude,
                            }
                            map.setCenter(userCoords)
                            marker.setPosition(userCoords)
                            handleLocationUpdate(userCoords.lat, userCoords.lng)
                        },
                        () => {
                            handleLocationUpdate(center.lat, center.lng)
                        },
                        { timeout: 5000 }
                    )
                } else {
                    handleLocationUpdate(center.lat, center.lng)
                }

                setIsLoadingMap(false)
            })
            .catch((err) => {
                console.error('Failed to load Google Maps:', err)
                if (isMounted) {
                    setLoadError('Не вдалося завантажити Google Maps. Перевірте інтернет або API ключ.')
                    setIsLoadingMap(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const handleSearch = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (!searchQuery.trim() || isSearching) return

        setIsSearching(true)
        try {
            const result = await searchLocation(searchQuery)
            if (result && mapInstanceRef.current && markerRef.current) {
                const target = { lat: result.lat, lng: result.lng }
                mapInstanceRef.current.panTo(target)
                mapInstanceRef.current.setZoom(16)
                markerRef.current.setPosition(target)
                setCurrentAddress(result.label || searchQuery)
            } else {
                alert('Локацію не знайдено. Спробуйте вказати місто або точнішу адресу.')
            }
        } catch (err) {
            console.error('Search error:', err)
        } finally {
            setIsSearching(false)
        }
    }

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Геолокація не підтримується цим браузером.')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                if (mapInstanceRef.current && markerRef.current) {
                    mapInstanceRef.current.panTo(coords)
                    mapInstanceRef.current.setZoom(16)
                    markerRef.current.setPosition(coords)
                    handleLocationUpdate(coords.lat, coords.lng)
                }
            },
            () => {
                alert('Не вдалося отримати ваше поточне місцезнаходження.')
            }
        )
    }

    return {
        mapContainerRef,
        isLoadingMap,
        loadError,
        searchQuery,
        setSearchQuery,
        isSearching,
        isGeocoding,
        currentAddress,
        handleSearch,
        handleLocateMe,
    }
}
