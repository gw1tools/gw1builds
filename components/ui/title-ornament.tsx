'use client'

import { cn } from '@/lib/utils'

interface TitleOrnamentProps {
  className?: string
}

export function TitleOrnament({ className }: TitleOrnamentProps) {
  return (
    <div
      className={cn(
        'relative flex items-center w-full h-3 mt-2 group',
        className
      )}
    >
      {/* Left fade line */}
      <div
        className="flex-1 h-px transition-all duration-500 group-hover:flex-[1.1]"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(245,240,230,0.7))',
        }}
      />

      {/* Center ornament cluster */}
      <div className="flex items-center gap-1.5 px-2">
        {/* Left dot - playful bounce on hover */}
        <div
          className={cn(
            'w-1 h-1 rounded-full bg-[#f5f0e6]/40',
            'transition-all duration-300',
            'group-hover:bg-[#f5f0e6]/70 group-hover:scale-125',
            'animate-[pulse_3s_ease-in-out_infinite]'
          )}
          style={{ animationDelay: '0.5s' }}
        />

        {/* Center diamond - gentle float animation */}
        <div
          className={cn(
            'w-2 h-2 rotate-45 border border-[#f5f0e6]/70',
            'transition-all duration-300',
            'group-hover:scale-110 group-hover:border-[#f5f0e6]/90',
            'animate-[float_4s_ease-in-out_infinite]'
          )}
          style={{
            boxShadow: '0 0 6px rgba(245,240,230,0.3)',
          }}
        />

        {/* Right dot - playful bounce on hover (offset timing) */}
        <div
          className={cn(
            'w-1 h-1 rounded-full bg-[#f5f0e6]/40',
            'transition-all duration-300',
            'group-hover:bg-[#f5f0e6]/70 group-hover:scale-125',
            'animate-[pulse_3s_ease-in-out_infinite]'
          )}
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Right fade line */}
      <div
        className="flex-1 h-px transition-all duration-500 group-hover:flex-[1.1]"
        style={{
          background:
            'linear-gradient(to left, transparent, rgba(245,240,230,0.7))',
        }}
      />
    </div>
  )
}
