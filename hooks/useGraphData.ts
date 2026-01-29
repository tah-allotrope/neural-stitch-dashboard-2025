import { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';

export interface GraphNode {
    id: string;
    val: number;
    taskCount: number;
}

export interface GraphLink {
    source: string;
    target: string;
    index: number;
    total: number;
}

export interface ParsedDayData {
    date: string;
    connections: string[][];
    tasks: Record<string, string[]>;
}

export const useGraphData = (currentDateIndex: number, selectedStaff: string[]) => {
    const [parsedData, setParsedData] = useState<ParsedDayData[]>([]);
    const [uniqueDates, setUniqueDates] = useState<string[]>([]);
    const [allStaff, setAllStaff] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const parsedDataRef = useRef(parsedData);
    useEffect(() => {
        parsedDataRef.current = parsedData;
    }, [parsedData]);

    useEffect(() => {
        const parseCSV = (csvData: string) => {
            const results = Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true
            });

            // 1. Generate All Weeks of 2025 (Mondays)
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
                dataByDate.set(date, row);
            });

            const timeData: ParsedDayData[] = [];
            const globalStaffSet = new Set<string>();

            // 3. Populate Every Week
            allWeeks.forEach(date => {
                const row = dataByDate.get(date);
                const dailyConnections: string[][] = [];
                const dailyTasks: Record<string, string[]> = {};

                if (row) {
                    Object.keys(row).forEach(key => {
                        if (key === 'Date') return;
                        const cellContent = row[key];
                        if (!cellContent) return;

                        // Regex Extraction: Text inside parentheses at the very end.
                        const regex = /\(([^)]+)\)\s*$/;
                        const match = regex.exec(cellContent);
                        const namesInTask = new Set<string>();

                        if (match) {
                            const rawNames = match[1].split('/');
                            const VIETNAM_STAFF = ['Tung', 'Cong', 'Anh', 'Hang', 'Trang', 'Tinh'];

                            rawNames.forEach(n => {
                                let cleanName = n.trim();

                                // Special Case: Tinh-2Anh
                                if (cleanName === 'Tinh-2Anh') {
                                    namesInTask.add('Tinh');
                                    namesInTask.add('Anh');
                                    return;
                                }

                                // CRITICAL 'All' Rule
                                if (cleanName.toLowerCase() === 'all') {
                                    VIETNAM_STAFF.forEach(staff => namesInTask.add(staff));
                                    return;
                                }

                                // The Bouncer Validation
                                const BLOCKLIST = ['local', 'others', 'kbc', 'pur', 'nuoa.io', 'scg cleanergy', 'etc'];
                                if (BLOCKLIST.includes(cleanName.toLowerCase())) return;
                                if (cleanName.length >= 20) return;
                                if (/^\d+$/.test(cleanName)) return;
                                if (/[?;]/.test(cleanName)) return;

                                if (cleanName.length > 0) {
                                    namesInTask.add(cleanName);
                                }
                            });

                            namesInTask.forEach(name => {
                                globalStaffSet.add(name);
                                if (!dailyTasks[name]) dailyTasks[name] = [];
                                dailyTasks[name].push(cellContent);
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
            setLoading(false);
        };

        fetch('/raw_data.csv')
            .then(res => res.text())
            .then(parseCSV)
            .catch(err => {
                console.error('Error loading CSV:', err);
                setLoading(false);
            });
    }, []);

    // --- GRAPH DATA CALC ---
    const graphData = useMemo(() => {
        if (!parsedData.length) return { nodes: [] as GraphNode[], links: [] as GraphLink[] };

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

        let nodes = Array.from(nodesMap.entries()).map(([id, data]) => ({
            id,
            val: data.val,
            taskCount: data.taskCount
        }));

        // Multi-Link Pre-processing
        const pairCounts: Record<string, number> = {};
        const pairIndexMap: Record<string, number> = {};

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

            return { ...link, index, total };
        }).filter(link => link.index < 5); // Performance Cap

        // Staff Filtering
        if (selectedStaff.length === 0) {
            return { nodes: [], links: [] };
        }

        nodes = nodes.filter(n => selectedStaff.includes(n.id));
        links = links.filter(l => selectedStaff.includes(l.source) && selectedStaff.includes(l.target));

        return { nodes, links };
    }, [parsedData, currentDateIndex, selectedStaff]);

    return {
        parsedData,
        uniqueDates,
        allStaff,
        graphData,
        loading,
        parsedDataRef
    };
};
