import React from 'react';
import { Search, X } from 'lucide-react';
import { getStringColor } from '../utils';

interface FilterPanelProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedStaff: string[];
    toggleStaffSelection: (name: string) => void;
    handleSelectAll: () => void;
    handleClearAll: () => void;
    filteredNames: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    searchQuery,
    setSearchQuery,
    selectedStaff,
    toggleStaffSelection,
    handleSelectAll,
    handleClearAll,
    filteredNames,
}) => {
    return (
        <div className="glass-panel p-4 rounded-2xl w-full md:w-96 shrink-0">
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filter Staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#0df280] transition-colors"
                />
            </div>

            <div className="mb-2 flex flex-wrap gap-2 items-center">
                {selectedStaff.map(name => (
                    <button
                        key={name}
                        onClick={() => toggleStaffSelection(name)}
                        className="flex items-center gap-1 text-[10px] bg-[#0df280] text-black px-2 py-1 rounded-full font-bold hover:bg-white transition-colors"
                    >
                        {name} <X className="w-3 h-3" />
                    </button>
                ))}
            </div>

            <div className="flex gap-3 mb-3 border-t border-white/5 pt-2">
                <button onClick={handleSelectAll} className="text-[10px] text-[#0df280] border border-[#0df280]/30 px-2 py-1 rounded">Select All</button>
                {selectedStaff.length > 0 && (
                    <button onClick={handleClearAll} className="text-[10px] text-gray-400 underline p-1">Clear All</button>
                )}
            </div>

            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                {filteredNames.map(name => (
                    <button
                        key={name}
                        onClick={() => toggleStaffSelection(name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedStaff.includes(name) ? 'bg-white/10 text-[#0df280]' : 'text-gray-300'}`}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStringColor(name) }}></span>
                        {name}
                    </button>
                ))}
            </div>
        </div>
    );
};
