import React, { useEffect, useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';
import ForceGraph3D from '3d-force-graph';
import { Play, Pause, Calendar, Search, X, Activity, Globe, Filter } from 'lucide-react';

// --- DATA & CONFIG ---
import rawData from './raw_data.csv?raw';

// --- DATA & CONFIG ---
// Dynamic color palette still used

const CSV_CONTENT = rawData; // Keeping variable name for minimal diff, or just replace usage.

// Color Palette
const COLORS = [
    "#FF007A", "#00FFFF", "#FFD700", "#FF4500", "#7FFF00",
    "#00BFFF", "#9932CC", "#FF1493", "#00FA9A", "#FF6347",
    "#1E90FF", "#DA70D6", "#FFFF00", "#00FF7F", "#FF69B4"
];

const getNodeColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
};

export default function App() {
    const graphRef = useRef<HTMLDivElement>(null);
    const graphInstance = useRef<any>(null);

    // Data State
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [uniqueDates, setUniqueDates] = useState<string[]>([]);
    const [allStaff, setAllStaff] = useState<string[]>([]);

    // Control State
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{ id: string, tasks: string[], date: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

    const [stats, setStats] = useState({ nodes: 0, links: 0 });

    // --- PARSING ---
    useEffect(() => {
        const results = Papa.parse(rawData, {
            header: true,
            skipEmptyLines: true
        });

        // 1. Generate All Weeks of 2025 (Mondays)
        // Helps ensure the timeline starts in Jan even if data starts later.
        const allWeeks: string[] = [];
        let d = new Date('2025-01-06'); // First Monday of 2025
        while (d.getFullYear() === 2025) {
            allWeeks.push(d.toISOString().split('T')[0]);
            d.setDate(d.getDate() + 7);
        }

        // 2. Map CSV Rows to Dates
        const dataByDate = new Map();
        results.data.forEach((row: any) => {
            const date = row['Date'];
            if (!date) return;

            // Basic normalization if needed, but assuming YYYY-MM-DD
            dataByDate.set(date, row);
        });

        const timeData: any[] = [];
        const globalStaffSet = new Set<string>();

        // 3. Populate Every Week
        allWeeks.forEach(date => {
            const row = dataByDate.get(date);
            const dailyConnections: any[] = [];
            const dailyTasks: Record<string, string[]> = {};

            if (row) {
                Object.keys(row).forEach(key => {
                    if (key === 'Date') return;
                    const cellContent = row[key];
                    if (!cellContent) return;

                    const regex = /\(([^)]+)\)/g;
                    let match;
                    const namesInTask = new Set<string>();

                    while ((match = regex.exec(cellContent)) !== null) {
                        match[1].split(/[\/,&]/).forEach(n => {
                            const cleanName = n.trim();
                            // Allow any name found in the pattern, minimal filtering length > 1
                            if (cleanName.length > 1) {
                                namesInTask.add(cleanName);
                                globalStaffSet.add(cleanName); // Collect globally
                                if (!dailyTasks[cleanName]) dailyTasks[cleanName] = [];
                                dailyTasks[cleanName].push(cellContent);
                            }
                        });
                    }

                    const namesArray = Array.from(namesInTask);
                    if (namesArray.length > 1) {
                        for (let i = 0; i < namesArray.length; i++) {
                            for (let j = i + 1; j < namesArray.length; j++) {
                                const pair = [namesArray[i], namesArray[j]].sort();
                                dailyConnections.push(pair);
                            }
                        }
                    }
                });
            }

            timeData.push({
                date,
                connections: dailyConnections,
                tasks: dailyTasks
            });
        });

        setParsedData(timeData);
        setUniqueDates(allWeeks);
        setAllStaff(Array.from(globalStaffSet).sort());
    }, []);

    // --- GRAPH DATA CALC ---
    const graphData = useMemo(() => {
        if (!parsedData.length) return { nodes: [], links: [] };

        // 1. Time Filtering (Sliding Window: Show specific week only? Or Cumulative?)
        // User asked for "filter data... active during that time window". 
        // Let's make it Cumulative up to that point to keep the network growing, 
        // BUT highlight/filter based on selection.
        // Actually, "Active during that time window" often implies a snapshot.
        // Let's stick to the previous cumulative logic but FILTER the result based on staff.

        const limitIndex = currentDateIndex;
        const nodesMap = new Map<string, { val: number, taskCount: number }>(); // Track connection strength AND task count
        const linksMap = new Map<string, number>();

        // We accumulate data up to the current date
        for (let i = 0; i <= limitIndex; i++) {
            const dayData = parsedData[i];

            // Accumulate connections
            dayData.connections.forEach((pair: string[]) => {
                const [source, target] = pair;

                // Update Node (Connection Strength)
                const sNode = nodesMap.get(source) || { val: 0, taskCount: 0 };
                const tNode = nodesMap.get(target) || { val: 0, taskCount: 0 };

                nodesMap.set(source, { ...sNode, val: sNode.val + 1 });
                nodesMap.set(target, { ...tNode, val: tNode.val + 1 });

                const linkId = `${source}-${target}`;
                linksMap.set(linkId, (linksMap.get(linkId) || 0) + 1);
            });

            // Accumulate Tasks (Independent of connections)
            // Note: If a staff has a task but no connection, they might not appear in 'connections' loop.
            // But usually valid names come from the same cells.
            Object.keys(dayData.tasks).forEach(staff => {
                const count = dayData.tasks[staff].length;
                const node = nodesMap.get(staff) || { val: 0, taskCount: 0 };
                // Using max(1) for val so they show up even if solitary? 
                // Or just keep val=0 if no connections? ForceGraph needs links usually?
                // For now, let's assume nodes only appear if they have connections in this visualization 
                // OR we can add them here.
                // The current logic only adds nodes if they exist in a connection pair.
                // Let's stick to that to avoid floating points unless desired.
                if (nodesMap.has(staff)) {
                    nodesMap.set(staff, { ...node, taskCount: node.taskCount + count });
                }
            });
        }

        let nodes = Array.from(nodesMap.entries()).map(([id, data]) => ({ id, val: data.val, taskCount: data.taskCount }));
        let links = Array.from(linksMap.entries()).map(([key, weight]) => {
            const [source, target] = key.split('-');
            return { source, target, weight };
        });

        // 2. Staff Filtering
        if (selectedStaff.length > 0) {
            // Filter nodes: Only selected staff OR staff connected to them?
            // "Display only those nodes" -> strict filter + their history.
            nodes = nodes.filter(n => selectedStaff.includes(n.id));

            // Filter connections: Only if BOTH are in selected staff? 
            // Or if ONE is in selected staff? usually "Both" for strict, "One" for egocentric.
            // Let's go strict for "Display only those nodes".
            links = links.filter(l => selectedStaff.includes(l.source) && selectedStaff.includes(l.target));
        }

        return { nodes, links };
    }, [parsedData, currentDateIndex, selectedStaff]);

    useEffect(() => {
        setStats({ nodes: graphData.nodes.length, links: graphData.links.length });
        if (graphInstance.current) {
            graphInstance.current.graphData(graphData);
        }
    }, [graphData]);

    // --- INIT GRAPH ---
    useEffect(() => {
        if (!graphRef.current) return;

        const myGraph = (ForceGraph3D as any)()(graphRef.current);
        graphInstance.current = myGraph;

        myGraph
            .backgroundColor('#050a08')
            .nodeLabel((node: any) => `${node.id}: ${node.taskCount || 0} Tasks`) // TOOLTIP UPDATE
            .nodeColor((node: any) => getNodeColor(node.id)) // Dynamic Color
            .nodeVal((node: any) => Math.sqrt(node.val) * 2)
            .nodeResolution(16)
            .nodeOpacity(1)
            .linkLabel(link => `Strength: ${link.weight}`)
            .linkColor(() => 'rgba(255, 255, 255, 0.2)')
            .linkWidth((link: any) => Math.sqrt(link.weight) * 0.5)
            .linkDirectionalParticles(2)
            .linkDirectionalParticleSpeed((d: any) => d.weight * 0.002)
            .onNodeClick((node: any) => {
                const tasks: string[] = [];
                for (let i = 0; i <= currentDateIndex; i++) {
                    const dayTasks = parsedData[i]?.tasks[node.id];
                    if (dayTasks) tasks.push(...dayTasks);
                }
                const uniqueTasks = Array.from(new Set(tasks));

                setSelectedNode({
                    id: node.id,
                    tasks: uniqueTasks,
                    date: uniqueDates[currentDateIndex]
                });
            });

        return () => {
            if (graphRef.current) graphRef.current.innerHTML = '';
        };
    }, []);

    // --- RESIZE ---
    useEffect(() => {
        const handleResize = () => {
            if (graphInstance.current) {
                graphInstance.current
                    .width(window.innerWidth)
                    .height(window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- PLAY LOOP ---
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentDateIndex(prev => {
                    const next = prev + 1;
                    if (next >= uniqueDates.length) return 0;
                    return next;
                });
            }, 500); // SLOWED DOWN (was 200)
        }
        return () => clearInterval(interval);
    }, [isPlaying, uniqueDates]);

    const currentDate = uniqueDates[currentDateIndex] || 'Loading...';

    // --- HELPERS ---
    const toggleStaffSelection = (name: string) => {
        setSelectedStaff(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const filteredNames = allStaff.filter(n =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-[#0df280] selection:text-black">

            {/* 3D Container */}
            <div ref={graphRef} className="absolute inset-0 z-0" />

            {/* HEADER & FILTER */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 max-h-[80vh]">
                {/* Title Card */}
                <div className="glass-panel p-5 rounded-2xl w-80 md:w-96">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#0df280] w-6 h-6" />
                            <div>
                                <h1 className="text-lg font-bold tracking-wider">Neural<span className="text-[#0df280]">Sync</span></h1>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Network HUD</p>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#0df280] animate-pulse"></div>
                    </div>
                </div>

                {/* Search / Filter */}
                <div className="glass-panel p-4 rounded-2xl w-80 md:w-96">
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

                    <div className="mb-2 flex flex-wrap gap-2">
                        {selectedStaff.map(name => (
                            <button
                                key={name}
                                onClick={() => toggleStaffSelection(name)}
                                className="flex items-center gap-1 text-[10px] bg-[#0df280] text-black px-2 py-1 rounded-full font-bold hover:bg-white transition-colors"
                            >
                                {name} <X className="w-3 h-3" />
                            </button>
                        ))}
                        {selectedStaff.length > 0 && (
                            <button onClick={() => setSelectedStaff([])} className="text-[10px] text-gray-400 hover:text-white underline p-1">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {filteredNames.map(name => (
                            <button
                                key={name}
                                onClick={() => toggleStaffSelection(name)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedStaff.includes(name) ? 'bg-white/10 text-[#0df280]' : 'text-gray-300'}`}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(name) }}></span>
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM TIMELINE */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-10">
                <div className="glass-panel rounded-full px-6 py-4 flex items-center gap-6">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-black' : 'bg-[#0df280] text-black hover:scale-110'}`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</span>
                            <span className="text-sm font-mono font-bold text-[#0df280]">{currentDate}</span>
                        </div>

                        <div className="relative h-6 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max={uniqueDates.length - 1 || 0}
                                value={currentDateIndex}
                                onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #0df280 0%, #0df280 ${(currentDateIndex / (uniqueDates.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(currentDateIndex / (uniqueDates.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILS PANEL */}
            {selectedNode && (
                <div className="absolute top-0 right-0 h-full w-full md:w-[400px] z-20 glass-panel border-l border-white/10 animate-slide-in flex flex-col">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <p className="text-xs text-[#0df280] uppercase tracking-widest mb-1">Personnel Record</p>
                            <h2 className="text-3xl font-bold font-mono" style={{ color: getNodeColor(selectedNode.id) }}>{selectedNode.id}</h2>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#0df280]" />
                                Validated Skills / Tasks
                            </h3>
                            <div className="space-y-3">
                                {selectedNode.tasks.map((task, idx) => (
                                    <div key={idx} className="p-3 bg-white/5 rounded border border-white/5 hover:border-[#0df280]/30 transition-colors group">
                                        <p className="text-xs leading-relaxed text-gray-300 group-hover:text-white transition-colors">
                                            {task.replace(/- /g, '').trim()}
                                        </p>
                                    </div>
                                ))}
                                {selectedNode.tasks.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No specific task descriptions logged.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Global styles for slider track
const style = document.createElement('style');
style.innerHTML = `
  input[type=range]::-webkit-slider-thumb {
    box-shadow: 0 0 15px #0df280;
    transition: transform 0.1s;
  }
  input[type=range]:active::-webkit-slider-thumb {
    transform: scale(1.3);
  }
`;
document.head.appendChild(style);
