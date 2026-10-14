'use client'

import React, { useState, useRef } from 'react'

type UseAvatarCropProps = {
    initialAvatar?: string | null
}

export const useAvatarCrop = ({ initialAvatar }: UseAvatarCropProps = {}) => {
    const [imageSrc, setImageSrc] = useState<string | null>(initialAvatar || null)
    const [zoom, setZoom] = useState(1)
    const [xOffset, setXOffset] = useState(0)
    const [yOffset, setYOffset] = useState(0)

    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0 })
    const offsetStart = useRef({ x: 0, y: 0 })
    const lastTouchDistance = useRef<number | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setImageSrc(reader.result as string)
                setZoom(1)
                setXOffset(0)
                setYOffset(0)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileSelect = () => {
        fileInputRef.current?.click()
    }

    // Touch handlers for mobile devices
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            setIsDragging(false)
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            lastTouchDistance.current = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )
        } else if (e.touches.length === 1) {
            setIsDragging(true)
            dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            offsetStart.current = { x: xOffset, y: yOffset }
        }
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const dist = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )

            if (lastTouchDistance.current !== null) {
                const delta = dist - lastTouchDistance.current
                const zoomFactor = delta * 0.015
                setZoom((prev) => Math.max(1, Math.min(5, prev + zoomFactor)))
            }
            lastTouchDistance.current = dist
        } else if (e.touches.length === 1 && isDragging) {
            const clientX = e.touches[0].clientX
            const clientY = e.touches[0].clientY
            const dx = clientX - dragStart.current.x
            const dy = clientY - dragStart.current.y
            setXOffset(offsetStart.current.x + dx)
            setYOffset(offsetStart.current.y + dy)
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        lastTouchDistance.current = null
    }

    // Mouse handlers for desktop browser drag-to-move
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
        dragStart.current = { x: e.clientX, y: e.clientY }
        offsetStart.current = { x: xOffset, y: yOffset }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        setXOffset(offsetStart.current.x + dx)
        setYOffset(offsetStart.current.y + dy)
    }

    const handleMouseUpOrLeave = () => {
        setIsDragging(false)
    }

    // Mouse wheel handler to zoom
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const zoomStep = 0.08
        const direction = e.deltaY < 0 ? 1 : -1
        setZoom((prev) => Math.max(1, Math.min(5, prev + direction * zoomStep)))
    }

    const cropImage = (): Promise<string> => {
        return new Promise((resolve) => {
            if (!imageSrc) return resolve('')

            const canvas = document.createElement('canvas')
            canvas.width = 150
            canvas.height = 150
            const ctx = canvas.getContext('2d')
            if (!ctx) return resolve('')

            const img = new Image()
            img.src = imageSrc
            img.onload = () => {
                ctx.clearRect(0, 0, 150, 150)

                // Circular clip
                ctx.beginPath()
                ctx.arc(75, 75, 75, 0, Math.PI * 2)
                ctx.clip()

                const drawWidth = 150 * zoom
                const drawHeight = (img.height / img.width) * drawWidth

                const dx = 75 - drawWidth / 2 + xOffset
                const dy = 75 - drawHeight / 2 + yOffset

                ctx.drawImage(img, dx, dy, drawWidth, drawHeight)
                resolve(canvas.toDataURL('image/jpeg', 0.5))
            }
            img.onerror = () => {
                resolve(imageSrc)
            }
        })
    }

    return {
        imageSrc,
        zoom,
        xOffset,
        yOffset,
        isDragging,
        fileInputRef,
        handleFileChange,
        triggerFileSelect,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleMouseDown,
        handleMouseMove,
        handleMouseUpOrLeave,
        handleWheel,
        cropImage,
    }
}
