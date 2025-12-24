"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

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
                {/* Match bg-slate-50 (#f8fafc) */}
                <fog attach="fog" args={['#f8fafc', 5, 15]} />
                <RotatingNetwork />
            </Canvas>
        </div>
    );
}
