import React from 'react';
import { Play, Pause } from 'lucide-react';

interface TimelineProps {
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    currentDate: string;
    currentDateIndex: number;
    setCurrentDateIndex: (index: number) => void;
    maxIndex: number;
}

export const Timeline: React.FC<TimelineProps> = ({
    isPlaying,
    setIsPlaying,
    currentDate,
    currentDateIndex,
    setCurrentDateIndex,
    maxIndex,
}) => {
    return (
        <div className="glass-panel rounded-full px-4 py-3 md:px-6 md:py-4 flex items-center gap-4 md:gap-6">
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-black' : 'bg-[#0df280] text-black hover:scale-110'}`}
            >
                {isPlaying ? <Pause className="w-3 h-3 md:w-4 md:h-4 fill-current" /> : <Play className="w-3 h-3 md:w-4 md:h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1 md:mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</span>
                    <span className="text-xs md:text-sm font-mono font-bold text-[#0df280] truncate ml-2">{currentDate}</span>
                </div>

                <div className="relative h-4 md:h-6 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={maxIndex}
                        value={currentDateIndex}
                        onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #0df280 0%, #0df280 ${(currentDateIndex / (maxIndex || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentDateIndex / (maxIndex || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
