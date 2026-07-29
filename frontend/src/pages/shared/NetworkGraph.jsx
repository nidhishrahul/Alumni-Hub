import { useState, useEffect, useRef, useCallback } from 'react';
import { Network as NetworkIcon, ZoomIn, ZoomOut, Maximize, Info } from 'lucide-react';

// Simple canvas-based graph visualization
const graphData = {
    nodes: [
        { id: 1, label: 'Dr. Priya Sharma', type: 'alumni', company: 'Google', x: 400, y: 250 },
        { id: 2, label: 'Rahul Verma', type: 'alumni', company: 'Microsoft', x: 250, y: 150 },
        { id: 3, label: 'Anita Patel', type: 'alumni', company: 'Amazon', x: 550, y: 150 },
        { id: 4, label: 'Vikram Singh', type: 'alumni', company: 'TechStartup', x: 150, y: 300 },
        { id: 5, label: 'Sneha Gupta', type: 'alumni', company: 'Meta', x: 650, y: 300 },
        { id: 6, label: 'Ravi Kumar', type: 'student', company: 'CSE Dept', x: 300, y: 400 },
        { id: 7, label: 'Meera Nair', type: 'student', company: 'IT Dept', x: 500, y: 400 },
        { id: 8, label: 'Arjun Das', type: 'student', company: 'CSE Dept', x: 400, y: 450 },
        { id: 9, label: 'Priya Menon', type: 'student', company: 'ECE Dept', x: 200, y: 450 },
        { id: 10, label: 'Arjun Reddy', type: 'alumni', company: 'Google', x: 600, y: 450 },
    ],
    edges: [
        { from: 1, to: 6, type: 'mentorship' }, { from: 1, to: 7, type: 'mentorship' },
        { from: 2, to: 7, type: 'mentorship' }, { from: 2, to: 8, type: 'mentorship' },
        { from: 3, to: 6, type: 'mentorship' }, { from: 4, to: 9, type: 'mentorship' },
        { from: 5, to: 8, type: 'mentorship' }, { from: 1, to: 3, type: 'company' },
        { from: 1, to: 10, type: 'company' }, { from: 2, to: 5, type: 'colleague' },
        { from: 3, to: 5, type: 'colleague' }, { from: 4, to: 2, type: 'department' },
    ],
};

const nodeColors = { alumni: '#3b82f6', student: '#14b8a6' };
const edgeColors = { mentorship: '#3b82f6', company: '#f59e0b', colleague: '#8b5cf6', department: '#64748b' };

export default function NetworkGraph() {
    const canvasRef = useRef(null);
    const [selected, setSelected] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        const w = rect.width;
        const h = rect.height;
        ctx.clearRect(0, 0, w, h);

        // Scale nodes to canvas
        const scaleX = w / 800;
        const scaleY = h / 550;

        // Draw edges
        graphData.edges.forEach(edge => {
            const from = graphData.nodes.find(n => n.id === edge.from);
            const to = graphData.nodes.find(n => n.id === edge.to);
            ctx.beginPath();
            ctx.moveTo(from.x * scaleX, from.y * scaleY);
            ctx.lineTo(to.x * scaleX, to.y * scaleY);
            ctx.strokeStyle = edgeColors[edge.type] || '#334155';
            ctx.lineWidth = selected && (selected.id === from.id || selected.id === to.id) ? 2 : 0.8;
            ctx.globalAlpha = selected && (selected.id === from.id || selected.id === to.id) ? 0.8 : 0.25;
            ctx.stroke();
            ctx.globalAlpha = 1;
        });

        // Draw nodes
        graphData.nodes.forEach(node => {
            const x = node.x * scaleX;
            const y = node.y * scaleY;
            const r = hoveredNode?.id === node.id ? 22 : 18;

            // Glow
            if (selected?.id === node.id || hoveredNode?.id === node.id) {
                ctx.beginPath();
                ctx.arc(x, y, r + 8, 0, Math.PI * 2);
                ctx.fillStyle = nodeColors[node.type] + '20';
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = nodeColors[node.type];
            ctx.globalAlpha = selected?.id === node.id ? 1 : 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Label
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label.split(' ')[0], x, y + r + 16);
        });
    }, [selected, hoveredNode]);

    useEffect(() => { draw(); }, [draw]);

    useEffect(() => {
        const handleResize = () => draw();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    const handleClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = rect.width / 800;
        const scaleY = rect.height / 550;

        const clicked = graphData.nodes.find(node => {
            const dx = x - node.x * scaleX;
            const dy = y - node.y * scaleY;
            return Math.sqrt(dx * dx + dy * dy) < 22;
        });

        setSelected(clicked || null);
    };

    const connections = selected
        ? graphData.edges.filter(e => e.from === selected.id || e.to === selected.id)
        : [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <NetworkIcon className="w-7 h-7 text-primary-400" /> Alumni Network Graph
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">Interactive social network analysis with graph analytics</p>
                </div>
                <div className="flex gap-2">
                    {Object.entries(edgeColors).map(([type, color]) => (
                        <span key={type} className="flex items-center gap-1.5 text-xs text-surface-400">
                            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                            <span className="capitalize">{type}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 card p-2" style={{ height: '500px' }}>
                    <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full cursor-pointer rounded-xl" style={{ background: 'rgba(15,23,42,0.5)' }} />
                </div>

                <div className="space-y-4">
                    {/* Stats */}
                    <div className="card space-y-3">
                        <h3 className="text-sm font-bold text-white">Network Stats</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-surface-400">Total Nodes</span><span className="font-bold text-white">{graphData.nodes.length}</span></div>
                            <div className="flex justify-between"><span className="text-surface-400">Total Connections</span><span className="font-bold text-white">{graphData.edges.length}</span></div>
                            <div className="flex justify-between"><span className="text-surface-400">Alumni</span><span className="font-bold text-primary-400">{graphData.nodes.filter(n => n.type === 'alumni').length}</span></div>
                            <div className="flex justify-between"><span className="text-surface-400">Students</span><span className="font-bold text-accent-400">{graphData.nodes.filter(n => n.type === 'student').length}</span></div>
                        </div>
                    </div>

                    {/* Selected Node */}
                    {selected && (
                        <div className="card space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: nodeColors[selected.type] }}>
                                    {selected.label[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{selected.label}</p>
                                    <p className="text-xs text-surface-400">{selected.company}</p>
                                </div>
                            </div>
                            <span className={`badge ${selected.type === 'alumni' ? 'badge-primary' : 'badge-accent'} capitalize`}>{selected.type}</span>
                            <div>
                                <p className="text-xs font-semibold text-surface-300 mb-2">Connections ({connections.length})</p>
                                <div className="space-y-1.5">
                                    {connections.map((c, i) => {
                                        const other = graphData.nodes.find(n => n.id === (c.from === selected.id ? c.to : c.from));
                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-surface-300">{other?.label}</span>
                                                <span className="badge text-[10px]" style={{ color: edgeColors[c.type], background: edgeColors[c.type] + '20' }}>{c.type}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {!selected && (
                        <div className="card text-center py-6">
                            <Info className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                            <p className="text-xs text-surface-400">Click a node to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
