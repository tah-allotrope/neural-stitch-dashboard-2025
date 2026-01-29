import React, { useState, useEffect, useCallback } from 'react';
import { X, Filter } from 'lucide-react';

import { useGraphData } from './hooks/useGraphData';
import { useTexturePreload } from './hooks/useTexturePreload';

import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { Timeline } from './components/Timeline';
import { DetailsPanel } from './components/DetailsPanel';
import { ForceGraph } from './components/ForceGraph';

export default function App() {
    // UI State
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{ id: string, tasks: string[], date: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<string[]>(['Anh', 'Cong', 'Hang', 'Tinh', 'Trang']);
    const [logoError, setLogoError] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Data Hooks
    const {
        uniqueDates,
        allStaff,
        graphData,
        parsedDataRef
    } = useGraphData(currentDateIndex, selectedStaff);

    useTexturePreload(allStaff);

    // Play Loop
    useEffect(() => {
        let interval: any;
        if (isPlaying && uniqueDates.length > 0) {
            interval = setInterval(() => {
                setCurrentDateIndex(prev => {
                    const next = prev + 1;
                    if (next >= uniqueDates.length) return 0;
                    return next;
                });
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying, uniqueDates]);

    const currentDate = uniqueDates[currentDateIndex] || 'Loading...';

    // Callbacks
    const toggleStaffSelection = useCallback((name: string) => {
        setSelectedStaff(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedStaff([...allStaff]);
    }, [allStaff]);

    const handleClearAll = useCallback(() => {
        setSelectedStaff([]);
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        const tasks: string[] = [];
        const data = parsedDataRef.current;
        const idx = currentDateIndex;

        for (let i = 0; i <= idx; i++) {
            const dayTasks = data[i]?.tasks[node.id];
            if (dayTasks) tasks.push(...dayTasks);
        }
        const uniqueTasks = Array.from(new Set(tasks));

        setSelectedNode({
            id: node.id,
            tasks: uniqueTasks,
            date: uniqueDates[idx]
        });
    }, [currentDateIndex, uniqueDates, parsedDataRef]);

    const filteredNames = allStaff.filter(n =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-[#0df280] selection:text-black">
            {graphData.nodes.length === 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="glass-panel px-8 py-4 rounded-2xl border border-[#0df280]/20 backdrop-blur-md animate-pulse">
                        <p className="text-[#0df280] font-mono text-lg tracking-widest uppercase">Select staff to view</p>
                    </div>
                </div>
            )}

            <ForceGraph graphData={graphData} onNodeClick={handleNodeClick} />

            {/* MOBILE TOGGLE BUTTON */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="absolute top-4 left-4 z-50 md:hidden p-3 bg-[#0df280] text-black rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
            </button>

            {/* HEADER & FILTER CONTAINER */}
            <div className={`
                absolute z-40 flex flex-col gap-4 transition-all duration-300 ease-in-out
                ${isMobileMenuOpen
                    ? 'top-16 left-4 right-4 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 max-h-[85vh] overflow-y-auto'
                    : 'hidden md:flex md:top-6 md:left-6 md:max-h-[80vh] md:bg-transparent md:backdrop-blur-none md:p-0 md:border-none md:overflow-visible'}
            `}>
                <Header
                    nodes={graphData.nodes.length}
                    links={graphData.links.length}
                    logoError={logoError}
                    setLogoError={setLogoError}
                />

                <FilterPanel
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedStaff={selectedStaff}
                    toggleStaffSelection={toggleStaffSelection}
                    handleSelectAll={handleSelectAll}
                    handleClearAll={handleClearAll}
                    filteredNames={filteredNames}
                />
            </div>

            {/* BOTTOM TIMELINE */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[600px] z-10 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <p className="hidden md:block text-center text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    Left-click: rotate · Mouse-wheel: zoom · Right-click: pan · Click nodes to view tasks
                </p>

                <Timeline
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    currentDate={currentDate}
                    currentDateIndex={currentDateIndex}
                    setCurrentDateIndex={setCurrentDateIndex}
                    maxIndex={uniqueDates.length - 1 || 0}
                />
            </div>

            {/* DETAILS PANEL */}
            {selectedNode && (
                <DetailsPanel
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                />
            )}
        </div>
    );
}
