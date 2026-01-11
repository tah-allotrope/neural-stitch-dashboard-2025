import React, { useEffect, useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import { Play, Pause, Calendar, Search, X, Activity, Globe, Filter } from 'lucide-react';

// --- DATA & CONFIG ---
import rawData from './raw_data.csv?raw';

// --- DATA & CONFIG ---
// Dynamic color palette still used

const CSV_CONTENT = rawData; // Keeping variable name for minimal diff, or just replace usage.

// Color Palette
// 2. High-Contrast Node Colors: String-to-HSL Hash
// Staff name to image filename mapping (case-sensitive for Firebase)
const STAFF_IMAGE_MAP: Record<string, string> = {
    'aiden': 'Aiden',
    'anh': 'Anh',
    'cong': 'Cong',
    'hang': 'Hang',
    'marc': 'Marc',
    'michelle': 'Michelle',
    'rob': 'Rob',
    'tinh': 'Tinh',
    'trang': 'Trang',
    'tung': 'Tung',
};

const getStaffImagePath = (staffName: string): string => {
    const normalizedName = STAFF_IMAGE_MAP[staffName.toLowerCase()] || staffName;
    return `staff/${normalizedName}.webp`;
};

const getStringColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Hue: 0-360 (Full spectrum)
    const hue = Math.abs(hash % 360);
    // Saturation: 75% (High pop)
    // Lightness: 50% (Medium for visibility on black)
    return `hsl(${hue}, 75%, 50%)`;
};

// --- TEXTURE CACHE MANAGER ---
const textureCache: Record<string, THREE.Texture> = {};
const textureLoader = new THREE.TextureLoader();

// --- PERFORMANCE: SHARED ASSETS ---
const sharedSphereGeometry = new THREE.SphereGeometry(1, 16, 16);
const materialCache: Record<string, THREE.MeshLambertMaterial> = {};
const getSharedMaterial = (id: string, texture?: THREE.Texture) => {
    const key = `${id}-${texture?.uuid || 'none'}`;
    if (!materialCache[key]) {
        materialCache[key] = new THREE.MeshLambertMaterial({
            color: texture ? 0xffffff : getStringColor(id),
            map: texture || null,
            transparent: true,
            opacity: 0.9
        });
    }
    return materialCache[key];
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
    const [selectedStaff, setSelectedStaff] = useState<string[]>(['Anh', 'Cong', 'Hang', 'Tinh', 'Trang']);

    const [stats, setStats] = useState({ nodes: 0, links: 0 });
    const [logoError, setLogoError] = useState(false);

    // --- REFS FOR STALE CLOSURE FIX ---
    const currentDateIndexRef = useRef(currentDateIndex);
    const parsedDataRef = useRef(parsedData);

    useEffect(() => {
        currentDateIndexRef.current = currentDateIndex;
    }, [currentDateIndex]);

    useEffect(() => {
        parsedDataRef.current = parsedData;
    }, [parsedData]);

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

                    // New Logic: 
                    // 1. Target Description: Look for column/row containing task text (already iterating row keys)
                    // 2. Regex Extraction: Text inside parentheses at the very end of the string.
                    const regex = /\(([^)]+)\)\s*$/;
                    const match = regex.exec(cellContent);
                    const namesInTask = new Set<string>();

                    if (match) {
                        // 3. Split & Expand
                        const rawNames = match[1].split('/');
                        const VIETNAM_STAFF = ['Tung', 'Cong', 'Anh', 'Hang', 'Trang', 'Tinh'];

                        rawNames.forEach(n => {
                            let cleanName = n.trim();

                            // 1. Special Case: Tinh-2Anh
                            if (cleanName === 'Tinh-2Anh') {
                                namesInTask.add('Tinh');
                                namesInTask.add('Anh');
                                return;
                            }

                            // 2. CRITICAL 'All' Rule
                            if (cleanName.toLowerCase() === 'all') {
                                VIETNAM_STAFF.forEach(staff => namesInTask.add(staff));
                                return;
                            }

                            // 3. The Bouncer Validation
                            // Blocklist
                            const BLOCKLIST = ['local', 'others', 'kbc', 'pur', 'nuoa.io', 'scg cleanergy'];
                            if (BLOCKLIST.includes(cleanName.toLowerCase())) return;

                            // Length Check (< 20 chars)
                            if (cleanName.length >= 20) return;

                            // Number Check (no purely numeric strings, though CSV might produce string "15")
                            if (/^\d+$/.test(cleanName)) return;

                            // Symbol Check
                            if (/[?;]/.test(cleanName)) return;

                            // If it survives The Bouncer, let it in
                            if (cleanName.length > 0) {
                                namesInTask.add(cleanName);
                            }
                        });

                        // 4. Data Flattening & Cleanup
                        namesInTask.forEach(name => {
                            globalStaffSet.add(name);
                            if (!dailyTasks[name]) dailyTasks[name] = [];
                            dailyTasks[name].push(cellContent);
                        });
                    }
                    // 5. Cleanup: If no parentheses/names, skip (implied by if(match))

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

    // --- PRE-LOAD TEXTURES ---
    useEffect(() => {
        if (!allStaff.length) return;

        allStaff.forEach(staff => {
            if (textureCache[staff]) return; // Skip already loaded

            const imagePath = getStaffImagePath(staff);
            textureLoader.load(
                imagePath,
                (texture) => {
                    textureCache[staff] = texture;
                },
                undefined,
                () => {
                    // Fail silently or log once
                    // console.log(`Texture not available for ${staff}`);
                }
            );
        });
    }, [allStaff]);

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
        const nodesMap = new Map<string, { val: number, taskCount: number }>();
        const rawLinks: { source: string, target: string }[] = [];

        for (let i = 0; i <= limitIndex; i++) {
            const dayData = parsedData[i];

            dayData.connections.forEach((pair: string[]) => {
                const [source, target] = pair;
                const sNode = nodesMap.get(source) || { val: 0, taskCount: 0 };
                const tNode = nodesMap.get(target) || { val: 0, taskCount: 0 };
                nodesMap.set(source, { ...sNode, val: sNode.val + 1 });
                nodesMap.set(target, { ...tNode, val: tNode.val + 1 });

                rawLinks.push({ source, target });
            });

            Object.keys(dayData.tasks).forEach(staff => {
                const count = dayData.tasks[staff].length;
                const node = nodesMap.get(staff) || { val: 0, taskCount: 0 };
                nodesMap.set(staff, {
                    val: node.val + (count * 0.1),
                    taskCount: node.taskCount + count
                });
            });
        }

        let nodes = Array.from(nodesMap.entries()).map(([id, data]) => ({ id, val: data.val, taskCount: data.taskCount }));

        // Multi-Link Pre-processing: Calculate index and total per pair
        const pairCounts: Record<string, number> = {};
        const pairIndexMap: Record<string, number> = {};

        // Filter out self-loops and invalid links
        const validLinks = rawLinks.filter(l => l.source && l.target && l.source !== l.target);

        validLinks.forEach(link => {
            const id = [link.source, link.target].sort().join('-|-');
            pairCounts[id] = (pairCounts[id] || 0) + 1;
        });

        let links = validLinks.map(link => {
            const id = [link.source, link.target].sort().join('-|-');
            const total = pairCounts[id];
            const index = pairIndexMap[id] || 0;
            pairIndexMap[id] = index + 1;

            // PERFORMANCE: Tighter Adaptive Capping
            // Cap at 5 links per pair for high-frequency segments
            return { ...link, index, total };
        }).filter(link => link.index < 5);

        // 2. Staff Filtering - STRICT MASKING
        if (selectedStaff.length === 0) {
            return { nodes: [], links: [] };
        }

        nodes = nodes.filter(n => selectedStaff.includes(n.id));
        links = links.filter(l => selectedStaff.includes(l.source) && selectedStaff.includes(l.target));

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
            .showNavInfo(false) // Hide default nav info, we have our own
            .nodeLabel((node: any) => `${node.id}: ${node.taskCount || 0} Tasks`) // TOOLTIP UPDATE
            .nodeThreeObject((node: any) => {
                const radius = Math.sqrt(node.val) * 0.8;
                const texture = textureCache[node.id];

                // PERFORMANCE: Use shared geometry and material cache
                const mesh = new THREE.Mesh(sharedSphereGeometry, getSharedMaterial(node.id, texture));
                mesh.scale.set(radius, radius, radius);
                return mesh;
            })
            .nodeVal((node: any) => Math.sqrt(node.val) * 0.8)
            .nodeResolution(16)
            .nodeOpacity(1)
            .linkLabel((link: any) => {
                const { index, total } = link;
                if (total > 5) {
                    return `Connection ${index + 1} of ${total} (Capped at 5 for Performance)`;
                }
                return `Connection ${index + 1} of ${total}`;
            })
            .linkCurvature((link: any) => {
                const { index, total } = link;
                if (total <= 1) return 0;
                // Centered Fan Math: Max spread 0.4 for tighter look
                return ((index - (total - 1) / 2) / (total / 2 || 1)) * 0.2;
            })
            .linkColor((link: any) => {
                const t = Math.min(link.total / 15, 1);
                const r = Math.round(t * 255);
                const g = Math.round(255 - t * 235);
                const b = Math.round(255 - t * 108);
                return `rgba(${r}, ${g}, ${b}, 0.15)`;
            })
            .linkWidth(0.5)
            // PERFORMANCE: Restored subtle particles (1 per link) for the "fired" effect
            .linkDirectionalParticles(1)
            .linkDirectionalParticleWidth(0.5)
            .linkDirectionalParticleSpeed((link: any) => {
                // Stronger connections = Faster firing (Base 0.005, Max 0.02)
                return 0.005 + Math.min(link.total / 20, 1) * 0.015;
            })
            .onNodeClick((node: any) => {
                const tasks: string[] = [];
                // Use Refs to avoid stale closure from graph initialization
                const data = parsedDataRef.current;
                const idx = currentDateIndexRef.current;

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
            });

        // 3. PHYSICS CLUSTERING
        myGraph.d3Force('link').distance((link: any) => {
            // Short distance for high weight, Long for low weight
            return 100 / (link.weight || 1);
        });

        // 3. WARM UP & COOLDOWN (PERFORMANCE)
        myGraph.d3Force('link').distance(80);
        myGraph.d3Force('collide', d3.forceCollide(node => {
            return Math.sqrt(node.val) * 0.8 + 4;
        }));

        // Faster stabilization to reduce background CPU
        myGraph.d3AlphaDecay(0.08);

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

    const handleSelectAll = () => {
        setSelectedStaff([...allStaff]);
    };

    const filteredNames = allStaff.filter(n =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-[#0df280] selection:text-black">
            {/* Empty State Message */}
            {graphData.nodes.length === 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="glass-panel px-8 py-4 rounded-2xl border border-[#0df280]/20 backdrop-blur-md animate-pulse">
                        <p className="text-[#0df280] font-mono text-lg tracking-widest uppercase">Select staff to view</p>
                    </div>
                </div>
            )}

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
                                {/* replaced text with logo */}
                                <div className="flex items-center gap-4">
                                    {logoError ? (
                                        <span className="text-xl font-bold text-[#0df280]">Neural Sync</span>
                                    ) : (
                                        <img
                                            src="logo.png"
                                            className="h-[40px] w-auto"
                                            alt="Neural Sync"
                                            onError={() => setLogoError(true)}
                                        />
                                    )}
                                    <div className="flex flex-col">
                                        <p
                                            className="text-[10px] text-[#0df280] font-mono cursor-help"
                                            title="Node size correlates with the number of tasks completed."
                                        >
                                            Nodes: {stats.nodes}
                                        </p>
                                        <p
                                            className="text-[10px] text-[#0df280] font-mono cursor-help"
                                            title="Pink color and particle speed correlate with the connection strength between two nodes."
                                        >
                                            Links: {stats.links}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Network HUD</p>
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
                        <button
                            onClick={handleSelectAll}
                            className="text-[10px] text-[#0df280] hover:text-white border border-[#0df280]/30 px-2 py-1 rounded transition-colors font-bold uppercase tracking-wider"
                        >
                            Select All
                        </button>
                        {selectedStaff.length > 0 && (
                            <button
                                onClick={() => setSelectedStaff([])}
                                className="text-[10px] text-gray-400 hover:text-white underline p-1"
                            >
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
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStringColor(name) }}></span>
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM TIMELINE */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-10">
                <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    Left-click: rotate · Mouse-wheel: zoom · Right-click: pan · Click nodes to view tasks
                </p>
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
                            <h2 className="text-3xl font-bold font-mono" style={{ color: getStringColor(selectedNode.id) }}>{selectedNode.id}</h2>
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
