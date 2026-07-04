'use client'

import { useEffect, useState } from 'react'
import { FiChevronDown, FiX } from 'react-icons/fi'

export interface Option {
  value: any
  label: string
}

export interface ClearableSelectProps {
  value?: any
  placeholder?: string
  options?: Option[]
  onChange?: (value: any) => void
  clearable?: boolean
  required?: boolean
}

export default function ClearableSelect(props: ClearableSelectProps) {
  const { options = [], value, placeholder, onChange, clearable = true, required } = props
  const [selectedOption, setSelectedOption] = useState(value)

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedOption(value)
    onChange && onChange(value)
  }

  const clearSelection = () => {
    setSelectedOption('')
    onChange && onChange(undefined)
  }

  useEffect(() => {
    setSelectedOption(value)
  }, [value])

  return (
    <div className="relative w-auto text-sm flex flex-nowarp shrink-0">
      <select
        required={required}
        value={selectedOption}
        onChange={handleOptionChange}
        className={`h-8 w-full pl-4 pr-8 appearance-none border rounded-sm box-border hover:border-gray-500 bg-white ${selectedOption ? 'text-black' : 'text-gray-400'}`}
      >
        {!selectedOption && <option value="">{placeholder || 'Select'}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={!option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex h-4 w-4 items-center justify-center absolute right-2 top-1/2 transform -translate-y-1/2">
        {!!selectedOption && clearable ? (
          <button type="button" onClick={clearSelection} className="text-gray-500 hover:text-gray-800" aria-label="Clear selection">
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <div className="pointer-events-none">
            <FiChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
          </div>
        )}
      </div>
    </div>
  )
}
