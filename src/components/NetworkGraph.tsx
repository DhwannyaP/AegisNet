import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { usePackets } from "../context/PacketContext";
import { GraphNode, GraphLink, GraphParticle } from "../core/types";

interface TooltipData {
  ip: string;
  packetCount: number;
  threatCount: number;
  x: number;
  y: number;
}

export const NetworkGraph: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { packets } = usePackets();
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

    const { nodes, links } = useMemo(() => {
        const nodeMap = new Map<string, GraphNode>();
        const linkMap = new Map<string, GraphLink>();
        const recentPackets = packets.slice(0, 150);

        recentPackets.forEach(pkt => {
            // Source node
            if (!nodeMap.has(pkt.src_ip)) {
                nodeMap.set(pkt.src_ip, { id: pkt.src_ip, group: pkt.is_anomaly ? 2 : 1, val: 1, ip: pkt.src_ip, packetCount: 1, threatCount: pkt.is_anomaly ? 1 : 0, attackType: pkt.is_anomaly ? pkt.attack_type : undefined });
            } else {
                const n = nodeMap.get(pkt.src_ip)!;
                n.packetCount += 1;
                if (pkt.is_anomaly) { n.group = 2; n.threatCount += 1; n.attackType = pkt.attack_type; }
                n.val += 0.5;
            }
            // Dest node
            if (!nodeMap.has(pkt.dst_ip)) {
                nodeMap.set(pkt.dst_ip, { id: pkt.dst_ip, group: 3, val: 3, ip: pkt.dst_ip, packetCount: 1, threatCount: 0 });
            } else {
                nodeMap.get(pkt.dst_ip)!.packetCount += 1;
                nodeMap.get(pkt.dst_ip)!.val += 0.3;
            }
            // Link
            const linkId = `${pkt.src_ip}-${pkt.dst_ip}`;
            if (!linkMap.has(linkId)) {
                linkMap.set(linkId, { source: pkt.src_ip, target: pkt.dst_ip, value: 1, protocol: pkt.protocol, isAttack: !!pkt.is_anomaly });
            } else {
                const l = linkMap.get(linkId)!;
                l.value += 0.2;
                if (pkt.is_anomaly) l.isAttack = true;
            }
        });

        return { nodes: Array.from(nodeMap.values()), links: Array.from(linkMap.values()) };
    }, [packets]);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);

        // Zoom
        const g = svg.append("g");
        svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (e) => {
            g.attr("transform", e.transform);
        }) as any);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-280))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(d => Math.sqrt((d as GraphNode).val) * 12 + 8));

        // Links
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.min(Math.sqrt(d.value), 4))
            .attr("stroke", d => d.isAttack ? "rgba(239,68,68,0.5)" : "rgba(148,163,184,0.25)")
            .attr("stroke-dasharray", d => d.isAttack ? "4,3" : "none");

        // Nodes
        const nodeColor = (d: GraphNode) => {
            if (d.group === 3) return "#f59e0b"; // Target server (amber)
            if (d.group === 2) return "#ef4444"; // Attacker (red)
            return "#3b82f6"; // Normal (blue)
        };

        const nodeRadius = (d: GraphNode) => Math.min(Math.sqrt(d.val) * 5 + 4, 25);

        const node = g.append("g")
            .selectAll<SVGCircleElement, GraphNode>("circle")
            .data(nodes)
            .join("circle")
            .attr("r", nodeRadius)
            .attr("fill", d => nodeColor(d))
            .attr("stroke", d => d.group === 2 ? "rgba(239,68,68,0.8)" : d.group === 3 ? "rgba(245,158,11,0.8)" : "rgba(59,130,246,0.5)")
            .attr("stroke-width", d => d.group !== 1 ? 2 : 1)
            .attr("filter", d => d.group === 2 ? "url(#glow-red)" : d.group === 3 ? "url(#glow-amber)" : "none")
            .style("cursor", "pointer")
            .call(drag(simulation) as any);

        // Glow filters
        const defs = svg.append("defs");
        [["glow-red"], ["glow-amber"], ["glow-blue"]].forEach(([id]) => {
            const filter = defs.append("filter").attr("id", id);
            filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
            const feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        });

        // Labels
        const labels = g.append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text(d => d.ip)
            .attr("font-size", "9px")
            .attr("fill", "rgba(203,213,225,0.8)")
            .attr("dx", d => nodeRadius(d) + 3)
            .attr("dy", 3)
            .style("pointer-events", "none")
            .style("user-select", "none");

        // Hover tooltip
        node.on("mouseover", (event, d) => {
            const rect = svgRef.current!.getBoundingClientRect();
            setTooltip({ ip: d.ip, packetCount: d.packetCount, threatCount: d.threatCount, x: event.clientX - rect.left, y: event.clientY - rect.top });
        }).on("mousemove", (event) => {
            const rect = svgRef.current!.getBoundingClientRect();
            setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
        }).on("mouseout", () => setTooltip(null));

        simulation.on("tick", () => {
            link.attr("x1", d => (d.source as GraphNode).x!).attr("y1", d => (d.source as GraphNode).y!)
                .attr("x2", d => (d.target as GraphNode).x!).attr("y2", d => (d.target as GraphNode).y!);
            node.attr("cx", d => d.x!).attr("cy", d => d.y!);
            labels.attr("x", d => d.x!).attr("y", d => d.y!);
        });

        simulationRef.current = simulation;
        return () => { simulation.stop(); };
    }, [nodes, links]);

    // Particle System
    useEffect(() => {
        if (!svgRef.current || links.length === 0) return;

        const svg = d3.select(svgRef.current);
        const particleGroup = svg.select("g").append("g").attr("class", "particles");
        let particles: GraphParticle[] = [];
        let animationId: number;

        const animate = () => {
            if (Math.random() < 0.4) {
                const randomLink = links[Math.floor(Math.random() * links.length)];
                particles.push({
                    link: randomLink,
                    progress: 0,
                    speed: 0.008 + Math.random() * 0.018,
                    id: Math.random(),
                    type: randomLink.isAttack ? "attack" : "normal"
                });
            }
            particles.forEach(p => { p.progress += p.speed; });
            particles = particles.filter(p => p.progress < 1);

            particleGroup.selectAll<SVGCircleElement, GraphParticle>("circle")
                .data(particles, d => d.id)
                .join("circle")
                .attr("r", d => d.type === "attack" ? 3.5 : 2.5)
                .attr("fill", d => d.type === "attack" ? "#ef4444" : "#60a5fa")
                .attr("filter", d => d.type === "attack" ? "url(#glow-red)" : "url(#glow-blue)")
                .attr("cx", d => {
                    const src = d.link.source as GraphNode; const dst = d.link.target as GraphNode;
                    return src.x! + (dst.x! - src.x!) * d.progress;
                })
                .attr("cy", d => {
                    const src = d.link.source as GraphNode; const dst = d.link.target as GraphNode;
                    return src.y! + (dst.y! - src.y!) * d.progress;
                });

            animationId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationId);
    }, [links]);

    const drag = (simulation: d3.Simulation<GraphNode, GraphLink>) => {
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
        }
        function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
            event.subject.fx = event.x; event.subject.fy = event.y;
        }
        function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null; event.subject.fy = null;
        }
        return d3.drag<SVGCircleElement, GraphNode>().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    };

    const totalThreats = nodes.filter(n => n.group === 2).length;

    return (
        <div className="h-full w-full bg-card/50 rounded-xl border border-border relative overflow-hidden flex flex-col">
            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border text-xs space-y-1.5 shadow-lg">
                {[
                    { color: "bg-blue-500", label: "Normal Host" },
                    { color: "bg-red-500", label: "Attacker / Threat", glow: true },
                    { color: "bg-amber-500", label: "Target Server" },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                        <span className="text-muted-foreground">{item.label}</span>
                    </div>
                ))}
                <div className="border-t border-border/50 pt-1.5 mt-1.5 text-muted-foreground">
                    <span className="font-mono">{nodes.length}</span> nodes · <span className="text-red-400 font-mono">{totalThreats}</span> threats
                </div>
            </div>

            {/* Graph Controls hint */}
            <div className="absolute bottom-4 left-4 z-10 text-[10px] text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
                Scroll to zoom · Drag to pan · Drag nodes to rearrange
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute z-20 bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl text-xs pointer-events-none"
                    style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
                >
                    <div className="font-mono font-bold mb-1">{tooltip.ip}</div>
                    <div className="text-muted-foreground">Packets: <span className="text-foreground font-medium">{tooltip.packetCount}</span></div>
                    {tooltip.threatCount > 0 && (
                        <div className="text-red-400">Threats: <span className="font-bold">{tooltip.threatCount}</span></div>
                    )}
                </div>
            )}

            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>
    );
};
