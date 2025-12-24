"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

function NetworkNodes({ count = 150 }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const [lines, setLines] = useState<Float32Array>(new Float32Array(0));

    // Generate random points
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Create a cloud distribution
            const r = 4;
            const x = (Math.random() - 0.5) * r * 2; // Spread wider X
            const y = (Math.random() - 0.5) * r * 1.5;
            const z = (Math.random() - 0.5) * r * 1.5;
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
        }
        return pos;
    }, [count]);

    // Animation loop: rotate and update lines
    useFrame((state, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.x += delta * 0.05;
            pointsRef.current.rotation.y += delta * 0.08;

            // Dynamic connections calculation (simplified for performance)
            // Note: Real-time nearest neighbor search in JS loop can be heavy for high N.
            // For N=150 it's okay (150*150 = 22500 checks).

            const linePositions = [];
            const threshold = 1.8; // Connection distance
            const posArray = pointsRef.current.geometry.attributes.position.array;

            // We need WORLD positions for lines if points rotate? 
            // Actually, if we draw lines inside the same rotating group, we use local positions.
            // But useFrame updates rotation of the Group/Points. 
            // This means the local positions are static.
            // So we can calculate lines ONCE in useMemo if points don't move relative to each other.
            // The user asked for "Network of connected nodes... make them slowly rotate".
            // If relative positions don't change, we calculate connections mainly once.
            // But if we want "pulsing", maybe we move them slightly?
            // Let's stick to rotating the whole cloud for stability/perf first.

            // Calculate lines only once ideally, or sparingly. 
            // For now, let's calc statically.
        }
    });

    // Calculate static connections for the cloud
    const connectionPositions = useMemo(() => {
        const linePos = [];
        const threshold = 1.2;

        for (let i = 0; i < count; i++) {
            const x1 = positions[i * 3];
            const y1 = positions[i * 3 + 1];
            const z1 = positions[i * 3 + 2];

            for (let j = i + 1; j < count; j++) {
                const x2 = positions[j * 3];
                const y2 = positions[j * 3 + 1];
                const z2 = positions[j * 3 + 2];

                const dist = Math.sqrt(
                    (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2
                );

                if (dist < threshold) {
                    linePos.push(x1, y1, z1);
                    linePos.push(x2, y2, z2);
                }
            }
        }
        return new Float32Array(linePos);
    }, [positions, count]);

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#0f766e" // Teal-700
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
            <mesh ref={(node) => {
                if (node && pointsRef.current) {
                    // Sync rotation helper
                    // Actually, we want lines to rotate WITH points.
                    // So we put them in the same group? No, Points is a separate object.
                    // We'll wrap both in a parent group that rotates.
                }
            }}>
                {/* We render lines as a separate segments geometry */}
                {/* React Three Drei Line is useful but Segment might be better for many disjoint lines */}
            </mesh>
        </group>
    );
}

function RotatingNetwork({ count = 100 }) {
    const groupRef = useRef<THREE.Group>(null!);

    // Generate random points
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const r = 5;
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * r * 2.5; // Spread X
            pos[i * 3 + 1] = (Math.random() - 0.5) * r * 1.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * r * 1.0;
        }
        return pos;
    }, [count]);

    // Calculate connections
    const connections = useMemo(() => {
        const pts = [];
        const threshold = 1.5;
        for (let i = 0; i < count; i++) {
            const v1 = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            for (let j = i + 1; j < count; j++) {
                const v2 = new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                if (v1.distanceTo(v2) < threshold) {
                    pts.push(v1);
                    pts.push(v2);
                }
            }
        }
        return pts;
    }, [positions, count]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05; // Slow rotate
            // Pulse effect?
            const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
            groupRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group ref={groupRef}>
            <Points positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#f97316" // Orange-500
                    size={0.08}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
            <Line
                points={connections}
                color="#fdba74" // Orange-300
                opacity={0.4}
                transparent
                lineWidth={1.5}
            />
        </group>
    )
}

export function NetworkBackground() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none fade-edges">
            <style jsx>{`
                .fade-edges {
                    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                }
            `}</style>
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 2]}>
                {/* White fog to fade edges */}
                <fog attach="fog" args={['#f8fafc', 5, 15]} />
                <RotatingNetwork />
            </Canvas>
        </div>
    );
}
