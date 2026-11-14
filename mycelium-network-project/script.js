/**
 * MyceliNet AI - Mushroom-Inspired Computer Network Simulator
 * Implements a 12-node, 24-branch organic mycelium graph with real-time
 * weighted Dijkstra AI route selection, fault injection, and SVG packet animation.
 */

(() => {
  "use strict";

  // ==================== 1. NETWORK TOPOLOGY DATA ====================
  const nodes = [
    { id: "N1",  name: "PC-01", role: "Core Gateway",   x: 95,  y: 290 },
    { id: "N2",  name: "PC-02", role: "North Relay",    x: 245, y: 120 },
    { id: "N3",  name: "PC-03", role: "West Hub",       x: 265, y: 290 },
    { id: "N4",  name: "PC-04", role: "South Relay",    x: 245, y: 465 },
    { id: "N5",  name: "PC-05", role: "Ridge Node",     x: 445, y: 95  },
    { id: "N6",  name: "PC-06", role: "Cluster Hub A",  x: 465, y: 235 },
    { id: "N7",  name: "PC-07", role: "Cluster Hub B",  x: 465, y: 385 },
    { id: "N8",  name: "PC-08", role: "Root Node",      x: 455, y: 515 },
    { id: "N9",  name: "PC-09", role: "Upper Bridge",   x: 675, y: 135 },
    { id: "N10", name: "PC-10", role: "Central Switch", x: 685, y: 305 },
    { id: "N11", name: "PC-11", role: "Lower Bridge",   x: 680, y: 465 },
    { id: "N12", name: "PC-12", role: "Destination Host", x: 900, y: 290 }
  ];

  // 24 redundant mycelium connections with organic curve offsets & AI health multipliers
  const rawEdges = [
    { id: "E1",  source: "N1",  target: "N2",  curve: -24, aiFactor: 1.05 },
    { id: "E2",  source: "N1",  target: "N3",  curve: 14,  aiFactor: 1.00 },
    { id: "E3",  source: "N1",  target: "N4",  curve: 26,  aiFactor: 1.10 },
    { id: "E4",  source: "N2",  target: "N3",  curve: -16, aiFactor: 1.12 },
    { id: "E5",  source: "N2",  target: "N5",  curve: -20, aiFactor: 1.00 },
    { id: "E6",  source: "N3",  target: "N4",  curve: 18,  aiFactor: 1.08 },
    { id: "E7",  source: "N3",  target: "N6",  curve: -18, aiFactor: 1.02 },
    { id: "E8",  source: "N3",  target: "N7",  curve: 20,  aiFactor: 1.15 },
    { id: "E9",  source: "N4",  target: "N7",  curve: -16, aiFactor: 1.08 },
    { id: "E10", source: "N4",  target: "N8",  curve: 22,  aiFactor: 1.05 },
    { id: "E11", source: "N5",  target: "N6",  curve: 16,  aiFactor: 1.12 },
    { id: "E12", source: "N5",  target: "N9",  curve: -24, aiFactor: 1.02 },
    { id: "E13", source: "N6",  target: "N7",  curve: -15, aiFactor: 1.10 },
    { id: "E14", source: "N6",  target: "N9",  curve: -18, aiFactor: 1.18 },
    { id: "E15", source: "N6",  target: "N10", curve: 14,  aiFactor: 1.00 },
    { id: "E16", source: "N7",  target: "N8",  curve: 16,  aiFactor: 1.12 },
    { id: "E17", source: "N7",  target: "N10", curve: -16, aiFactor: 1.06 },
    { id: "E18", source: "N7",  target: "N11", curve: 20,  aiFactor: 1.08 },
    { id: "E19", source: "N8",  target: "N11", curve: 24,  aiFactor: 1.04 },
    { id: "E20", source: "N9",  target: "N10", curve: 18,  aiFactor: 1.10 },
    { id: "E21", source: "N9",  target: "N12", curve: -26, aiFactor: 1.05 },
    { id: "E22", source: "N10", target: "N11", curve: -18, aiFactor: 1.14 },
    { id: "E23", source: "N10", target: "N12", curve: 14,  aiFactor: 1.00 },
    { id: "E24", source: "N11", target: "N12", curve: 26,  aiFactor: 1.10 }
  ];

  // Enrich edges with physical distance and active flag
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = rawEdges.map((edge) => {
    const a = nodeMap[edge.source];
    const b = nodeMap[edge.target];
    const distance = Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 10);
    return {
      ...edge,
      distance,
      active: true
    };
  });

  // ==================== 2. APPLICATION STATE ====================
  const state = {
    sourceId: "N1",
    destId: "N12",
    routingMode: "ai", // "ai" | "shortest"
    currentRoute: null, // { nodes: [], edges: [], totalCost, hops }
    failurePickMode: false,
    nodePickMode: null, // "source" | "dest" | null
    isTransmitting: false,
    animationFrameId: null,
    animationToken: 0
  };

  // ==================== 3. DOM ELEMENTS ====================
  const el = {
    navToggle: document.getElementById("navToggle"),
    navLinks: document.getElementById("navLinks"),
    sourceSelect: document.getElementById("sourceSelect"),
    destSelect: document.getElementById("destSelect"),
    routingMode: document.getElementById("routingMode"),
    pickSourceBtn: document.getElementById("pickSourceBtn"),
    pickDestBtn: document.getElementById("pickDestBtn"),
    btnSendData: document.getElementById("btnSendData"),
    btnFailureMode: document.getElementById("btnFailureMode"),
    failureModeBtnText: document.getElementById("failureModeBtnText"),
    btnSeverActive: document.getElementById("btnSeverActive"),
    btnResetNetwork: document.getElementById("btnResetNetwork"),
    failedLinksList: document.getElementById("failedLinksList"),
    failedCountBadge: document.getElementById("failedCountBadge"),
    simBanner: document.getElementById("simBanner"),
    simBannerIcon: document.getElementById("simBannerIcon"),
    simBannerText: document.getElementById("simBannerText"),
    svgWrapper: document.getElementById("svgWrapper"),
    hyphaeLayer: document.getElementById("hyphaeLayer"),
    edgesLayer: document.getElementById("edgesLayer"),
    edgeLabelsLayer: document.getElementById("edgeLabelsLayer"),
    packetsLayer: document.getElementById("packetsLayer"),
    nodesLayer: document.getElementById("nodesLayer"),
    routePathVisual: document.getElementById("routePathVisual"),
    routeExplanation: document.getElementById("routeExplanation"),
    aiConsoleLog: document.getElementById("aiConsoleLog"),
    btnClearLog: document.getElementById("btnClearLog"),
    statNetworkStatus: document.getElementById("statNetworkStatus"),
    statActiveNodes: document.getElementById("statActiveNodes"),
    statActiveLinks: document.getElementById("statActiveLinks"),
    statEndpoints: document.getElementById("statEndpoints"),
    statHopsCost: document.getElementById("statHopsCost"),
    statRouteStatus: document.getElementById("statRouteStatus")
  };

  // ==================== 4. AI ROUTE SELECTION (DIJKSTRA) ====================
  function getEdgeCost(edge) {
    if (state.routingMode === "ai") {
      return edge.distance * edge.aiFactor;
    }
    return edge.distance;
  }

  function findOptimalRoute(startId, endId) {
    if (!startId || !endId || startId === endId) return null;

    const distances = {};
    const previousNode = {};
    const previousEdge = {};
    const visited = new Set();
    const queue = [];

    for (const node of nodes) {
      distances[node.id] = Infinity;
      previousNode[node.id] = null;
      previousEdge[node.id] = null;
    }

    distances[startId] = 0;
    queue.push({ id: startId, dist: 0 });

    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift();

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.id === endId) break;

      // Explore all active mycelium connections incident on current.id
      for (const edge of edges) {
        if (!edge.active) continue;

        let neighborId = null;
        if (edge.source === current.id) neighborId = edge.target;
        else if (edge.target === current.id) neighborId = edge.source;

        if (!neighborId || visited.has(neighborId)) continue;

        const altCost = distances[current.id] + getEdgeCost(edge);
        if (altCost < distances[neighborId]) {
          distances[neighborId] = altCost;
          previousNode[neighborId] = current.id;
          previousEdge[neighborId] = edge.id;
          queue.push({ id: neighborId, dist: altCost });
        }
      }
    }

    if (distances[endId] === Infinity) {
      return null; // Graph is partitioned between startId and endId
    }

    const nodePath = [];
    const edgePath = [];
    let cursor = endId;

    while (cursor !== null) {
      nodePath.unshift(cursor);
      if (previousEdge[cursor]) {
        edgePath.unshift(previousEdge[cursor]);
      }
      cursor = previousNode[cursor];
    }

    return {
      nodes: nodePath,
      edges: edgePath,
      totalCost: Number(distances[endId].toFixed(1)),
      hops: edgePath.length
    };
  }

  // ==================== 5. GEOMETRY & SVG RENDERING ====================
  function computeQuadControlPoint(a, b, offset) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Unit normal perpendicular to AB
    const nx = -dy / len;
    const ny = dx / len;
    return {
      cx: mx + nx * offset,
      cy: my + ny * offset
    };
  }

  function getCurveMidpoint(a, b, offset) {
    const { cx, cy } = computeQuadControlPoint(a, b, offset);
    // Quadratic Bezier point at t = 0.5
    return {
      x: 0.25 * a.x + 0.5 * cx + 0.25 * b.x,
      y: 0.25 * a.y + 0.5 * cy + 0.25 * b.y
    };
  }

  function createSvgEl(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, val] of Object.entries(attrs)) {
      node.setAttribute(key, String(val));
    }
    return node;
  }

  function renderHyphaeDecor() {
    el.hyphaeLayer.innerHTML = "";
    // Organic rootlet tendrils branching around nodes for realistic mycelium look
    nodes.forEach((n, idx) => {
      const angle1 = (idx * 57) % 360;
      const angle2 = (angle1 + 140) % 360;
      [angle1, angle2].forEach((deg, j) => {
        const rad = (deg * Math.PI) / 180;
        const len = 34 + ((idx + j) % 3) * 12;
        const ex = n.x + Math.cos(rad) * len;
        const ey = n.y + Math.sin(rad) * len;
        const cx = n.x + Math.cos(rad + 0.35) * (len * 0.55);
        const cy = n.y + Math.sin(rad + 0.35) * (len * 0.55);

        const path = createSvgEl("path", {
          d: `M ${n.x} ${n.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
          stroke: "#10b981",
          "stroke-width": "1.2",
          fill: "none",
          "stroke-linecap": "round"
        });
        const tip = createSvgEl("circle", {
          cx: ex.toFixed(1),
          cy: ey.toFixed(1),
          r: "2",
          fill: "#34d399"
        });
        el.hyphaeLayer.appendChild(path);
        el.hyphaeLayer.appendChild(tip);
      });
    });
  }

  function renderNetworkGraph() {
    el.edgesLayer.innerHTML = "";
    el.edgeLabelsLayer.innerHTML = "";
    el.nodesLayer.innerHTML = "";

    const routeEdgesSet = new Set(state.currentRoute ? state.currentRoute.edges : []);
    const routeNodesSet = new Set(state.currentRoute ? state.currentRoute.nodes : []);

    // 1. Render Edges
    edges.forEach((edge) => {
      const a = nodeMap[edge.source];
      const b = nodeMap[edge.target];
      const { cx, cy } = computeQuadControlPoint(a, b, edge.curve);
      const d = `M ${a.x} ${a.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
      const isRoute = edge.active && routeEdgesSet.has(edge.id);

      const group = createSvgEl("g", {
        class: "edge-group",
        "data-edge-id": edge.id
      });

      const title = createSvgEl("title");
      title.textContent = edge.active
        ? `${edge.id}: ${a.name} ↔ ${b.name} (Cost: ${getEdgeCost(edge).toFixed(1)}) — Click to Disable`
        : `${edge.id}: ${a.name} ↔ ${b.name} [FAILED] — Click to Restore`;
      group.appendChild(title);

      const visiblePath = createSvgEl("path", {
        id: `edge-path-${edge.id}`,
        d,
        class: `edge-visible ${!edge.active ? "edge-failed" : isRoute ? "edge-route" : ""}`
      });
      group.appendChild(visiblePath);

      if (isRoute) {
        const flowPath = createSvgEl("path", {
          d,
          class: "edge-flow-overlay"
        });
        group.appendChild(flowPath);
      }

      // Wide transparent hit area for easy clicking on desktop/mobile
      const hitPath = createSvgEl("path", {
        d,
        class: "edge-hit"
      });
      group.appendChild(hitPath);

      group.addEventListener("click", () => handleEdgeClick(edge.id));
      el.edgesLayer.appendChild(group);

      // Edge midpoint badge (cost or failure marker)
      const mid = getCurveMidpoint(a, b, edge.curve);
      const labelGroup = createSvgEl("g", { class: "edge-weight-pill" });

      if (!edge.active) {
        const failCircle = createSvgEl("circle", {
          cx: mid.x.toFixed(1),
          cy: mid.y.toFixed(1),
          r: "10",
          fill: "#450a0a",
          stroke: "#ef4444",
          "stroke-width": "1.6"
        });
        const failX = createSvgEl("text", {
          x: mid.x.toFixed(1),
          y: (mid.y + 3.5).toFixed(1),
          "text-anchor": "middle",
          fill: "#fecaca",
          "font-size": "11",
          "font-weight": "bold"
        });
        failX.textContent = "✕";
        labelGroup.appendChild(failCircle);
        labelGroup.appendChild(failX);
      } else {
        const costText = getEdgeCost(edge).toFixed(0);
        const bgRect = createSvgEl("rect", {
          x: (mid.x - 12).toFixed(1),
          y: (mid.y - 8).toFixed(1),
          width: "24",
          height: "16",
          rx: "5",
          fill: isRoute ? "#064e3b" : "#071711",
          stroke: isRoute ? "#5eead4" : "rgba(52, 211, 153, 0.3)",
          "stroke-width": "1"
        });
        const txt = createSvgEl("text", {
          x: mid.x.toFixed(1),
          y: (mid.y + 3.5).toFixed(1),
          "text-anchor": "middle",
          fill: isRoute ? "#ecfdf5" : "#6ee7b7",
          "font-size": "9.5",
          "font-family": "monospace",
          "font-weight": isRoute ? "bold" : "normal"
        });
        txt.textContent = costText;
        labelGroup.appendChild(bgRect);
        labelGroup.appendChild(txt);
      }

      el.edgeLabelsLayer.appendChild(labelGroup);
    });

    // 2. Render Computer Nodes
    nodes.forEach((node) => {
      const isSource = node.id === state.sourceId;
      const isDest = node.id === state.destId;
      const isOnRoute = routeNodesSet.has(node.id);

      const g = createSvgEl("g", {
        class: "node-group",
        transform: `translate(${node.x}, ${node.y})`,
        "data-node-id": node.id
      });

      const title = createSvgEl("title");
      title.textContent = `${node.name} (${node.role}) — Click to select as endpoint`;
      g.appendChild(title);

      // Outer pulse halo for source, destination, or active route node
      if (isSource || isDest || isOnRoute) {
        const halo = createSvgEl("circle", {
          r: isSource || isDest ? "30" : "26",
          fill: "none",
          stroke: isDest ? "#f59e0b" : "#34d399",
          "stroke-width": "1.6",
          "stroke-opacity": "0.55",
          "stroke-dasharray": isDest ? "4 3" : "none"
        });
        g.appendChild(halo);
      }

      // Main circular node container
      const ring = createSvgEl("circle", {
        r: "22",
        fill: "url(#nodeBgGrad)",
        stroke: isSource ? "#ffffff" : isDest ? "#f59e0b" : isOnRoute ? "#5eead4" : "#10b981",
        "stroke-width": isSource || isDest ? "3" : isOnRoute ? "2.6" : "2",
        class: "node-ring"
      });
      g.appendChild(ring);

      // Computer Monitor Icon inside Node
      const monitor = createSvgEl("rect", {
        x: "-10",
        y: "-10",
        width: "20",
        height: "13",
        rx: "2.2",
        fill: isOnRoute || isSource || isDest ? "#065f46" : "#08291e",
        stroke: isSource ? "#ffffff" : isDest ? "#fde68a" : "#a7f3d0",
        "stroke-width": "1.3"
      });
      const screenGlow = createSvgEl("line", {
        x1: "-6",
        y1: "-4",
        x2: "6",
        y2: "-4",
        stroke: "#5eead4",
        "stroke-width": "1.4",
        "stroke-linecap": "round"
      });
      const stand = createSvgEl("path", {
        d: "M -5 8 H 5 M 0 3 V 8",
        stroke: isSource ? "#ffffff" : isDest ? "#fde68a" : "#a7f3d0",
        "stroke-width": "1.4",
        "stroke-linecap": "round"
      });
      g.appendChild(monitor);
      g.appendChild(screenGlow);
      g.appendChild(stand);

      // Node Label below icon
      const label = createSvgEl("text", {
        y: "36",
        "text-anchor": "middle",
        fill: isSource || isDest ? "#ffffff" : "#cbd5e1",
        "font-size": "11",
        "font-weight": isSource || isDest || isOnRoute ? "700" : "600",
        "font-family": "monospace"
      });
      label.textContent = node.name;
      g.appendChild(label);

      // SRC / DST role tag above node
      if (isSource || isDest) {
        const badgeRect = createSvgEl("rect", {
          x: "-18",
          y: "-38",
          width: "36",
          height: "15",
          rx: "5",
          fill: isSource ? "#10b981" : "#f59e0b"
        });
        const badgeText = createSvgEl("text", {
          y: "-27.5",
          "text-anchor": "middle",
          fill: "#031a11",
          "font-size": "9",
          "font-weight": "800",
          "font-family": "sans-serif"
        });
        badgeText.textContent = isSource ? "SRC" : "DST";
        g.appendChild(badgeRect);
        g.appendChild(badgeText);
      }

      g.addEventListener("click", () => handleNodeClick(node.id));
      el.nodesLayer.appendChild(g);
    });
  }

  // ==================== 6. PACKET ANIMATION ENGINE ====================
  function cancelActiveAnimation() {
    state.animationToken += 1;
    if (state.animationFrameId !== null) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    state.isTransmitting = false;
    el.packetsLayer.innerHTML = "";
  }

  function animatePacketAlongRoute(route, isFailover = false) {
    cancelActiveAnimation();
    if (!route || route.edges.length === 0) return;

    const myToken = state.animationToken;
    state.isTransmitting = true;
    updateTelemetry(isFailover ? "Rerouting Data..." : "Transmitting Packet...");

    // Create glowing data spore / packet group
    const packetGroup = createSvgEl("g", { filter: "url(#packetGlow)" });
    const outerPulse = createSvgEl("circle", {
      r: "10",
      fill: isFailover ? "rgba(251, 191, 36, 0.35)" : "rgba(94, 234, 212, 0.35)"
    });
    const coreDot = createSvgEl("circle", {
      r: "5.5",
      fill: isFailover ? "#fde68a" : "#ecfdf5",
      stroke: isFailover ? "#f59e0b" : "#10b981",
      "stroke-width": "2"
    });
    packetGroup.appendChild(outerPulse);
    packetGroup.appendChild(coreDot);
    el.packetsLayer.appendChild(packetGroup);

    let segmentIndex = 0;
    let segmentStartTime = null;
    const segmentDuration = 580; // ms per mycelium branch hop

    function spawnHopRipple(x, y) {
      const ripple = createSvgEl("circle", {
        cx: x,
        cy: y,
        r: "16",
        fill: "none",
        stroke: isFailover ? "#fbbf24" : "#5eead4",
        "stroke-width": "2.4",
        opacity: "0.9"
      });
      el.packetsLayer.appendChild(ripple);

      const start = performance.now();
      function expand(now) {
        if (state.animationToken !== myToken) return;
        const p = Math.min(1, (now - start) / 420);
        ripple.setAttribute("r", String(16 + p * 20));
        ripple.setAttribute("opacity", String((1 - p).toFixed(2)));
        if (p < 1) {
          requestAnimationFrame(expand);
        } else if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }
      requestAnimationFrame(expand);
    }

    function step(timestamp) {
      if (state.animationToken !== myToken) return;

      if (segmentStartTime === null) {
        segmentStartTime = timestamp;
        const firstNode = nodeMap[route.nodes[0]];
        spawnHopRipple(firstNode.x, firstNode.y);
      }

      const edgeId = route.edges[segmentIndex];
      const edgeObj = edges.find((e) => e.id === edgeId);
      const pathEl = document.getElementById(`edge-path-${edgeId}`);

      if (!edgeObj || !pathEl) {
        cancelActiveAnimation();
        return;
      }

      const fromNodeId = route.nodes[segmentIndex];
      const isForward = edgeObj.source === fromNodeId;
      const elapsed = timestamp - segmentStartTime;
      const progress = Math.min(1, elapsed / segmentDuration);

      const totalLen = pathEl.getTotalLength();
      const distanceAlongPath = isForward
        ? progress * totalLen
        : (1 - progress) * totalLen;

      const pt = pathEl.getPointAtLength(distanceAlongPath);
      packetGroup.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);

      if (progress < 1) {
        state.animationFrameId = requestAnimationFrame(step);
      } else {
        const arrivedNode = nodeMap[route.nodes[segmentIndex + 1]];
        spawnHopRipple(arrivedNode.x, arrivedNode.y);
        segmentIndex += 1;
        segmentStartTime = timestamp;

        if (segmentIndex < route.edges.length) {
          state.animationFrameId = requestAnimationFrame(step);
        } else {
          // Transmission complete
          state.isTransmitting = false;
          state.animationFrameId = null;
          setTimeout(() => {
            if (state.animationToken === myToken) {
              el.packetsLayer.innerHTML = "";
              const destName = nodeMap[state.destId].name;
              updateTelemetry(isFailover ? "Delivered via Failover" : "Data Delivered");
              addConsoleLog(
                `Packet successfully delivered to ${destName} in ${route.hops} hops (AI Cost: ${route.totalCost}).`,
                "success"
              );
            }
          }, 260);
        }
      }
    }

    state.animationFrameId = requestAnimationFrame(step);
  }

  // ==================== 7. UI & TELEMETRY UPDATES ====================
  function setBanner(type, icon, htmlMessage) {
    el.simBanner.className = `sim-banner ${type}-banner`;
    el.simBannerIcon.innerHTML = icon;
    el.simBannerText.innerHTML = htmlMessage;
  }

  function addConsoleLog(message, level = "info") {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const entry = document.createElement("div");
    entry.className = `log-entry log-${level}`;
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span>${message}`;
    el.aiConsoleLog.prepend(entry);
  }

  function updateTelemetry(customRouteStatus = null) {
    const activeLinksCount = edges.filter((e) => e.active).length;
    const failedCount = edges.length - activeLinksCount;
    const srcName = nodeMap[state.sourceId].name;
    const dstName = nodeMap[state.destId].name;

    el.statActiveNodes.textContent = `${nodes.length} / ${nodes.length}`;
    el.statActiveLinks.textContent = `${activeLinksCount} / ${edges.length}`;
    el.statEndpoints.textContent = `${srcName} → ${dstName}`;
    el.failedCountBadge.textContent = String(failedCount);

    if (state.currentRoute) {
      el.statHopsCost.textContent = `${state.currentRoute.hops} Hops • Cost ${state.currentRoute.totalCost}`;
    } else {
      el.statHopsCost.textContent = "0 Hops • No Path";
    }

    if (customRouteStatus) {
      el.statRouteStatus.textContent = customRouteStatus;
    }

    // Overall network health indicator
    el.statNetworkStatus.className = "telemetry-value";
    if (!state.currentRoute && state.sourceId !== state.destId) {
      el.statNetworkStatus.textContent = "Partitioned (Route Blocked)";
      el.statNetworkStatus.classList.add("status-critical");
    } else if (failedCount > 0) {
      el.statNetworkStatus.textContent = `Self-Healed (${failedCount} Failed)`;
      el.statNetworkStatus.classList.add("status-warning");
    } else {
      el.statNetworkStatus.textContent = "Healthy & Optimal";
      el.statNetworkStatus.classList.add("status-healthy");
    }
  }

  function renderRouteSummary(isFailover = false) {
    if (!state.currentRoute) {
      el.routePathVisual.innerHTML = `<span class="chip-muted">No available communication path between selected nodes</span>`;
      el.routeExplanation.textContent =
        "All available mycelium branches connecting the source and destination have been severed. Restore at least one failed link to re-establish connectivity.";
      return;
    }

    const chipsHtml = state.currentRoute.nodes
      .map((id) => `<span class="path-chip">${nodeMap[id].name}</span>`)
      .join(`<span class="path-arrow">&rarr;</span>`);
    el.routePathVisual.innerHTML = chipsHtml;

    const strategyLabel =
      state.routingMode === "ai"
        ? "AI weighted cost (distance × congestion health)"
        : "shortest physical distance";

    el.routeExplanation.textContent = isFailover
      ? `Failover activated: Dijkstra's solver bypassed failed links using ${strategyLabel} to discover an alternative ${state.currentRoute.hops}-hop route (Cost: ${state.currentRoute.totalCost}).`
      : `Selected optimal ${state.currentRoute.hops}-hop route via Dijkstra's algorithm evaluating ${strategyLabel} (Total Cost: ${state.currentRoute.totalCost}).`;
  }

  function renderFailedLinksPanel() {
    const failedEdges = edges.filter((e) => !e.active);
    if (failedEdges.length === 0) {
      el.failedLinksList.innerHTML = `<p class="empty-note">All mycelium links are healthy. Click any branch on the map to disable it.</p>`;
      return;
    }

    el.failedLinksList.innerHTML = "";
    failedEdges.forEach((edge) => {
      const a = nodeMap[edge.source].name;
      const b = nodeMap[edge.target].name;
      const row = document.createElement("div");
      row.className = "failed-link-pill";
      row.innerHTML = `
        <span><strong>${edge.id}</strong> (${a} &harr; ${b})</span>
        <button type="button" class="restore-btn" data-restore-id="${edge.id}">Restore</button>
      `;
      row.querySelector(".restore-btn").addEventListener("click", () => {
        restoreEdge(edge.id);
      });
      el.failedLinksList.appendChild(row);
    });
  }

  // ==================== 8. INTERACTION HANDLERS ====================
  function populateDropdowns() {
    el.sourceSelect.innerHTML = "";
    el.destSelect.innerHTML = "";

    nodes.forEach((node) => {
      const optA = new Option(`${node.name} (${node.role})`, node.id);
      const optB = new Option(`${node.name} (${node.role})`, node.id);
      el.sourceSelect.add(optA);
      el.destSelect.add(optB);
    });

    el.sourceSelect.value = state.sourceId;
    el.destSelect.value = state.destId;
  }

  function runRouteCalculation({ animate = false, isFailover = false } = {}) {
    if (state.sourceId === state.destId) {
      state.currentRoute = null;
      cancelActiveAnimation();
      renderNetworkGraph();
      renderRouteSummary();
      updateTelemetry("Invalid Endpoints");
      setBanner("warning", "&#9888;", "Source and Destination cannot be the same computer. Please choose two different nodes.");
      return;
    }

    const route = findOptimalRoute(state.sourceId, state.destId);
    state.currentRoute = route;
    renderNetworkGraph();
    renderRouteSummary(isFailover);

    if (!route) {
      cancelActiveAnimation();
      updateTelemetry("No Path Available");
      setBanner(
        "danger",
        "&#10006;",
        `<strong>Network Partitioned!</strong> No alternative route exists between <strong>${nodeMap[state.sourceId].name}</strong> and <strong>${nodeMap[state.destId].name}</strong>. Click a red link or use Restore to reconnect.`
      );
      addConsoleLog(
        `Routing failed: ${nodeMap[state.sourceId].name} → ${nodeMap[state.destId].name} is unreachable.`,
        "error"
      );
      return;
    }

    const pathStr = route.nodes.map((id) => nodeMap[id].name).join(" → ");
    if (!animate) {
      updateTelemetry("Route Ready");
      addConsoleLog(`Calculated optimal route: ${pathStr} (Cost: ${route.totalCost}).`, "info");
    } else {
      animatePacketAlongRoute(route, isFailover);
    }
  }

  function handleSendData() {
    if (state.sourceId === state.destId) {
      setBanner("warning", "&#9888;", "Please select distinct Source and Destination computers before sending data.");
      return;
    }

    setFailurePickMode(false);
    const route = findOptimalRoute(state.sourceId, state.destId);
    state.currentRoute = route;
    renderNetworkGraph();
    renderRouteSummary(false);

    if (!route) {
      updateTelemetry("No Path Available");
      setBanner(
        "danger",
        "&#10006;",
        `Cannot transmit data: no active mycelium pathway connects <strong>${nodeMap[state.sourceId].name}</strong> to <strong>${nodeMap[state.destId].name}</strong>.`
      );
      addConsoleLog("Send Data aborted: network partitioned.", "error");
      return;
    }

    const pathStr = route.nodes.map((id) => nodeMap[id].name).join(" → ");
    setBanner(
      "info",
      "&#9889;",
      `Transmitting data along AI-selected route: <strong>${pathStr}</strong> (${route.hops} hops, Cost ${route.totalCost}).`
    );
    addConsoleLog(`Transmitting data via ${pathStr} (Hops: ${route.hops}, Cost: ${route.totalCost}).`, "info");
    animatePacketAlongRoute(route, false);
  }

  function disableEdge(edgeId) {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge || !edge.active) return;

    const wasOnActiveRoute = state.currentRoute && state.currentRoute.edges.includes(edgeId);
    edge.active = false;

    const label = `${nodeMap[edge.source].name} ↔ ${nodeMap[edge.target].name}`;
    addConsoleLog(`Connection ${edge.id} (${label}) FAILED / disabled.`, "warn");
    renderFailedLinksPanel();

    // Immediately recalculate alternative route if current route used this edge (or if any route is displayed)
    const altRoute = findOptimalRoute(state.sourceId, state.destId);
    state.currentRoute = altRoute;
    renderNetworkGraph();

    if (wasOnActiveRoute) {
      if (altRoute) {
        const altPathStr = altRoute.nodes.map((id) => nodeMap[id].name).join(" → ");
        renderRouteSummary(true);
        setBanner(
          "warning",
          "&#128260;",
          `<strong>Connection ${edge.id} (${label}) failed!</strong> Alternative AI route automatically selected: <strong>${altPathStr}</strong>. Rerouting data packet...`
        );
        addConsoleLog(`Failover triggered! Alternative route selected: ${altPathStr}.`, "warn");
        animatePacketAlongRoute(altRoute, true);
      } else {
        cancelActiveAnimation();
        renderRouteSummary(true);
        updateTelemetry("Route Severed");
        setBanner(
          "danger",
          "&#10006;",
          `<strong>Connection ${edge.id} (${label}) failed</strong> and no alternative pathway remains between ${nodeMap[state.sourceId].name} and ${nodeMap[state.destId].name}. Restore a link to continue.`
        );
        addConsoleLog(`Failover failed: no alternative path after ${edge.id} outage.`, "error");
      }
    } else {
      renderRouteSummary(false);
      updateTelemetry(altRoute ? "Route Ready" : "No Path Available");
      setBanner(
        "info",
        "&#9432;",
        `Disabled branch <strong>${edge.id} (${label})</strong>. Current active route remains unaffected.`
      );
    }
  }

  function restoreEdge(edgeId) {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge || edge.active) return;

    edge.active = true;
    const label = `${nodeMap[edge.source].name} ↔ ${nodeMap[edge.target].name}`;
    addConsoleLog(`Connection ${edge.id} (${label}) RESTORED.`, "success");
    renderFailedLinksPanel();

    // Re-evaluate optimal route now that link is healthy again
    runRouteCalculation({ animate: false, isFailover: false });
    setBanner(
      "info",
      "&#10004;",
      `Restored connection <strong>${edge.id} (${label})</strong>. AI topology updated and optimal route recalculated.`
    );
  }

  function handleEdgeClick(edgeId) {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    if (edge.active) {
      disableEdge(edgeId);
    } else {
      restoreEdge(edgeId);
    }
  }

  function handleNodeClick(nodeId) {
    if (state.nodePickMode === "source") {
      if (nodeId === state.destId) {
        setBanner("warning", "&#9888;", "Source cannot match Destination. Pick a different node.");
        return;
      }
      state.sourceId = nodeId;
      el.sourceSelect.value = nodeId;
      setNodePickMode(null);
      runRouteCalculation({ animate: false });
      return;
    }

    if (state.nodePickMode === "dest") {
      if (nodeId === state.sourceId) {
        setBanner("warning", "&#9888;", "Destination cannot match Source. Pick a different node.");
        return;
      }
      state.destId = nodeId;
      el.destSelect.value = nodeId;
      setNodePickMode(null);
      runRouteCalculation({ animate: false });
      return;
    }

    // Smart default click: if not source, set as destination for rapid exploration
    if (nodeId !== state.sourceId) {
      state.destId = nodeId;
      el.destSelect.value = nodeId;
      runRouteCalculation({ animate: false });
      setBanner(
        "info",
        "&#9432;",
        `Destination updated to <strong>${nodeMap[nodeId].name}</strong>. Click <strong>Send Data</strong> to transmit.`
      );
    }
  }

  function setFailurePickMode(enabled) {
    state.failurePickMode = enabled;
    el.btnFailureMode.classList.toggle("active", enabled);
    el.svgWrapper.classList.toggle("failure-picking", enabled);
    el.failureModeBtnText.textContent = enabled
      ? "Exit Failure Selection Mode"
      : "Simulate Connection Failure";

    if (enabled) {
      setBanner(
        "warning",
        "&#9888;",
        "<strong>Failure Simulation Active:</strong> Click any green mycelium branch on the diagram to sever it, or click a red branch to restore it."
      );
    }
  }

  function setNodePickMode(mode) {
    state.nodePickMode = mode;
    el.pickSourceBtn.classList.toggle("active", mode === "source");
    el.pickDestBtn.classList.toggle("active", mode === "dest");

    if (mode === "source") {
      setBanner("info", "&#128433;", "Click any computer node on the diagram to set it as the <strong>Source</strong>.");
    } else if (mode === "dest") {
      setBanner("info", "&#128433;", "Click any computer node on the diagram to set it as the <strong>Destination</strong>.");
    }
  }

  function severActiveRouteLink() {
    if (!state.currentRoute || state.currentRoute.edges.length === 0) {
      runRouteCalculation({ animate: false });
    }
    if (!state.currentRoute || state.currentRoute.edges.length === 0) {
      setBanner("danger", "&#10006;", "No active route link available to sever.");
      return;
    }

    // Pick a middle link on the active route for dramatic rerouting demonstration
    const midIdx = Math.floor(state.currentRoute.edges.length / 2);
    const targetEdgeId = state.currentRoute.edges[midIdx];
    disableEdge(targetEdgeId);
  }

  function resetNetwork() {
    cancelActiveAnimation();
    edges.forEach((e) => {
      e.active = true;
    });
    state.sourceId = "N1";
    state.destId = "N12";
    state.routingMode = "ai";
    el.sourceSelect.value = "N1";
    el.destSelect.value = "N12";
    el.routingMode.value = "ai";
    setFailurePickMode(false);
    setNodePickMode(null);

    renderFailedLinksPanel();
    runRouteCalculation({ animate: false });
    setBanner(
      "info",
      "&#9432;",
      "Network reset to healthy baseline. Click <strong>Send Data</strong> to transmit or click any branch to simulate failure."
    );
    addConsoleLog("Network reset: all 12 nodes and 24 mycelium connections restored.", "success");
  }

  // ==================== 9. EVENT LISTENERS & INIT ====================
  function bindEvents() {
    // Mobile nav toggle
    el.navToggle.addEventListener("click", () => {
      const isOpen = el.navLinks.classList.toggle("open");
      el.navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    el.navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        el.navLinks.classList.remove("open");
        el.navToggle.setAttribute("aria-expanded", "false");
      });
    });

    el.sourceSelect.addEventListener("change", (e) => {
      state.sourceId = e.target.value;
      runRouteCalculation({ animate: false });
    });

    el.destSelect.addEventListener("change", (e) => {
      state.destId = e.target.value;
      runRouteCalculation({ animate: false });
    });

    el.routingMode.addEventListener("change", (e) => {
      state.routingMode = e.target.value;
      addConsoleLog(
        `Switched routing strategy to: ${state.routingMode === "ai" ? "AI Weighted (Distance + Load)" : "Shortest Distance"}.`,
        "info"
      );
      runRouteCalculation({ animate: false });
    });

    el.pickSourceBtn.addEventListener("click", () => {
      setNodePickMode(state.nodePickMode === "source" ? null : "source");
    });

    el.pickDestBtn.addEventListener("click", () => {
      setNodePickMode(state.nodePickMode === "dest" ? null : "dest");
    });

    el.btnSendData.addEventListener("click", handleSendData);

    el.btnFailureMode.addEventListener("click", () => {
      setFailurePickMode(!state.failurePickMode);
    });

    el.btnSeverActive.addEventListener("click", severActiveRouteLink);
    el.btnResetNetwork.addEventListener("click", resetNetwork);

    el.btnClearLog.addEventListener("click", () => {
      el.aiConsoleLog.innerHTML = "";
    });
  }

  function init() {
    populateDropdowns();
    renderHyphaeDecor();
    bindEvents();
    renderFailedLinksPanel();
    runRouteCalculation({ animate: false });
    addConsoleLog("MyceliNet AI Simulator initialised (12 nodes, 24 links online).", "success");
  }

  document.addEventListener("DOMContentLoaded", init);
})();