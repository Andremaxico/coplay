import React from 'react'

type PropsType = {
    locationValue: string
    onLocationChange: (value: string) => void
    sportValue: string
    onSportChange: (value: string) => void
    dateValue: string
    onDateChange: (value: string) => void
}

export const Filters: React.FC<PropsType> = ({ locationValue, onLocationChange, sportValue, onSportChange, dateValue, onDateChange }) => {
    return (
        <div>
            <input
                type="text"
                placeholder="Локація"
                value={locationValue}
                onChange={(e) => onLocationChange(e.target.value)}
            />
            <input
                type="text"
                placeholder="Спорт"
                value={sportValue}
                onChange={(e) => onSportChange(e.target.value)}
            />
            <input
                type="date"
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
            />
        </div>
    )
}
