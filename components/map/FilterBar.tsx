'use client'

import type { PlotStatus } from '@/lib/types/database'

type FilterValue = PlotStatus | 'all'

interface FilterBarProps {
  active: FilterValue
  onChange: (value: FilterValue) => void
}

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
  { label: 'Blocked', value: 'blocked' },
]

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="absolute bottom-8 left-4 z-10 flex gap-2 flex-wrap">
      {FILTERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            active === value
              ? 'bg-white text-black shadow-md'
              : 'bg-black/50 text-white/80 hover:bg-black/70'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
