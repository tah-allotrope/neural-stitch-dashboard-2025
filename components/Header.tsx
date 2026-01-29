import React from 'react';
import { Activity } from 'lucide-react';

interface HeaderProps {
    nodes: number;
    links: number;
    logoError: boolean;
    setLogoError: (error: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ nodes, links, logoError, setLogoError }) => {
    return (
        <div className="glass-panel p-5 rounded-2xl w-full md:w-96 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Activity className="text-[#0df280] w-6 h-6" />
                    <div>
                        <div className="flex items-center gap-4">
                            {logoError ? (
                                <span className="text-xl font-bold text-[#0df280]">Neural Sync</span>
                            ) : (
                                <img
                                    src="/logo.png"
                                    className="h-[40px] w-auto"
                                    alt="Neural Sync"
                                    onError={() => setLogoError(true)}
                                />
                            )}
                            <div className="flex flex-col">
                                <p
                                    className="text-[10px] text-[#0df280] font-mono cursor-help"
                                    title="Node size correlates with the total number of tasks completed."
                                >
                                    Nodes: {nodes}
                                </p>
                                <p
                                    className="text-[10px] text-[#0df280] font-mono cursor-help"
                                    title="Neon pink color intensity and particle speed correlate with stronger connection frequency."
                                >
                                    Links: {links}
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Network HUD</p>
                    </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#0df280] animate-pulse"></div>
            </div>
        </div>
    );
};
