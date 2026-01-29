import React, { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import {
    textureCache,
    sharedSphereGeometry,
    getSharedMaterial
} from '../utils';

interface ForceGraphProps {
    graphData: any;
    onNodeClick: (node: any) => void;
}

export const ForceGraph: React.FC<ForceGraphProps> = ({ graphData, onNodeClick }) => {
    const graphRef = useRef<HTMLDivElement>(null);
    const graphInstance = useRef<any>(null);
    const onNodeClickRef = useRef(onNodeClick);

    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
    }, [onNodeClick]);

    useEffect(() => {
        if (!graphRef.current) return;

        const myGraph = (ForceGraph3D as any)()(graphRef.current);
        graphInstance.current = myGraph;

        myGraph
            .backgroundColor('#050a08')
            .showNavInfo(false)
            .nodeLabel((node: any) => `${node.id}: ${node.taskCount || 0} Tasks`)
            .nodeThreeObject((node: any) => {
                const radius = Math.sqrt(node.val) * 0.8;
                const texture = textureCache[node.id];
                const mesh = new THREE.Mesh(sharedSphereGeometry, getSharedMaterial(node.id, texture));
                mesh.scale.set(radius, radius, radius);
                return mesh;
            })
            .nodeVal((node: any) => Math.sqrt(node.val) * 0.8)
            .nodeResolution(16)
            .nodeOpacity(1)
            .linkLabel((link: any) => {
                const { index, total } = link;
                return total > 5 ? `Link ${index + 1}/${total} (Capped)` : `Link ${index + 1}/${total}`;
            })
            .linkCurvature((link: any) => {
                const { index, total } = link;
                if (total <= 1) return 0;
                return ((index - (total - 1) / 2) / (total / 2 || 1)) * 0.2;
            })
            .linkColor((link: any) => {
                const t = Math.min(link.total / 15, 1);
                const r = Math.round(t * 255);
                const g = Math.round(255 - t * 235);
                const b = Math.round(255 - t * 108);
                return `rgba(${r}, ${g}, ${b}, 0.4)`;
            })
            .linkWidth(1)
            .linkDirectionalParticles(1)
            .linkDirectionalParticleWidth(1.5)
            .linkDirectionalParticleSpeed((link: any) => {
                return 0.005 + Math.min(link.total / 20, 1) * 0.015;
            })
            .onNodeClick((node: any) => onNodeClickRef.current(node));

        myGraph.d3Force('link').distance((link: any) => 100 / (link.weight || 1));
        myGraph.d3Force('collide', d3.forceCollide((node: any) => Math.sqrt(node.val) * 0.8 + 4));
        myGraph.d3AlphaDecay(0.08);

        const handleResize = () => {
            if (graphInstance.current) {
                graphInstance.current
                    .width(window.innerWidth)
                    .height(window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (graphRef.current) graphRef.current.innerHTML = '';
        };
    }, []);

    useEffect(() => {
        if (graphInstance.current) {
            graphInstance.current.graphData(graphData);
        }
    }, [graphData]);

    return <div ref={graphRef} className="absolute inset-0 z-0" />;
};
