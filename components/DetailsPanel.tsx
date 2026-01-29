import React from 'react';
import { X, Globe } from 'lucide-react';
import { getStringColor } from '../utils';

interface DetailsPanelProps {
    selectedNode: { id: string, tasks: string[], date: string };
    setSelectedNode: (node: null) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedNode, setSelectedNode }) => {
    return (
        <div className="absolute top-0 right-0 h-full w-full md:w-[400px] z-20 glass-panel border-l border-white/10 animate-slide-in flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div>
                    <p className="text-xs text-[#0df280] uppercase tracking-widest mb-1">Personnel Record</p>
                    <h2 className="text-3xl font-bold font-mono" style={{ color: getStringColor(selectedNode.id) }}>{selectedNode.id}</h2>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#0df280]" /> Validated Skills / Tasks
                </h3>
                <div className="space-y-3">
                    {selectedNode.tasks.map((task, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded border border-white/5 hover:border-[#0df280]/30 transition-colors">
                            <p className="text-xs leading-relaxed text-gray-300">{task.replace(/- /g, '').trim()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
