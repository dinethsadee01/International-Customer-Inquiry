import React from "react"
import { Button } from "./button"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"

const ROOM_TYPES = [
  
  { key: "SGL", label: "Single (SGL)" },
  { key: "DBL", label: "Double (DBL)" },
  { key: "TRIPL", label: "Triple (TRIPL)" },
  { key: "QTRP", label: "Quadruple (QTRP)" },
  { key: "Suite", label: "Suite" },
]

type RoomSelectorProps = {
  value?: Record<string, number>
  onChange?: (updated: Record<string, number>) => void
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ value = {}, onChange }) => {
  const counts: Record<string, number> = {
    DBL: value.DBL || 0,
    SGL: value.SGL || 0,
    TRIPL: value.TRIPL || 0,
    QTRP: value.QTRP || 0,
    Suite: value.Suite || 0,
  }

  const updateCount = (key: string, delta: number) => {
    const updated = { ...counts, [key]: Math.max(0, (counts[key] || 0) + delta) }
    onChange && onChange(updated)
  }

  // Create summary string
  const summary = ROOM_TYPES
    .map((room) => (counts[room.key] > 0 ? `${counts[room.key]} ${room.key}` : null))
    .filter(Boolean)
    .join(", ") || "Select rooms"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full flex justify-between items-center px-4 py-2 text-left"
        >
          <span className="truncate">{summary}</span>
          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="flex flex-col gap-3">
          {ROOM_TYPES.map((room) => (
            <div key={room.key} className="flex items-center justify-between bg-white rounded-lg shadow p-3">
              <span className="font-medium text-gray-700 w-24">{room.label}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="px-2 py-1"
                  onClick={() => updateCount(room.key, -1)}
                  disabled={counts[room.key] === 0}
                >
                  –
                </Button>
                <span className="w-8 text-center font-mono">{counts[room.key]}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="px-2 py-1"
                  onClick={() => updateCount(room.key, 1)}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
