'use client';

import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface OptionCardsProps {
  options: string[];
  onSelect: (option: string) => void;
  className?: string;
}

export function OptionCards({ options, onSelect, className }: OptionCardsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(option)}
          disabled={selectedOption !== null}
          className={cn(
            'group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            'border-2 text-left min-w-[140px] max-w-[300px]',
            selectedOption === option
              ? 'border-turquoise-500 bg-turquoise-50 text-turquoise-700'
              : selectedOption !== null
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 bg-white hover:border-turquoise-300 hover:bg-turquoise-50/50 hover:shadow-md cursor-pointer'
          )}
        >
          <span className="block pr-6">{option}</span>
          {selectedOption === option && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-4 w-4 text-turquoise-500" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
