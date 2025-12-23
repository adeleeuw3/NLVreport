"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface EuropeMapProps {
    data: {
        nl: number;
        be: number;
        de: number;
    };
}

export function EuropeMap({ data }: EuropeMapProps) {
    // Normalize bubble sizes
    const maxValue = Math.max(data.nl, data.be, data.de, 1);
    const sizeScale = scaleLinear().domain([0, maxValue]).range([8, 24]);

    const markers = [
        { name: "Netherlands", coordinates: [5.2913, 52.1326], value: data.nl },
        { name: "Belgium", coordinates: [4.4699, 50.5039], value: data.be },
        { name: "Germany", coordinates: [10.4515, 51.1657], value: data.de },
    ];

    return (
        <div className="w-full h-full relative rounded-lg overflow-hidden bg-white/40">
            <ComposableMap
                projection="geoAzimuthalEqualArea"
                projectionConfig={{
                    rotate: [-6.0, -51.0, 0], // Centered precisely on NL/BE/DE border region
                    scale: 4000 // High zoom to fill the card
                }}
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies
                            .filter(d => ["NLD", "BEL", "DEU", "FRA", "LUX", "GBR", "CHE", "AUT", "DNK", "POL", "CZE"].includes(d.properties.iso_a3))
                            .map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#f1f5f9"
                                    stroke="#94a3b8" // Slate-400 for visible borders
                                    strokeWidth={1.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { outline: "none", fill: "#e2e8f0" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                    }
                </Geographies>
                {markers.map(({ name, coordinates, value }) => (
                    value > 0 && (
                        <Marker key={name} coordinates={coordinates as [number, number]}>
                            <circle r={sizeScale(value)} fill="var(--primary)" fillOpacity={0.8} stroke="#fff" strokeWidth={2} />
                            <text textAnchor="middle" y={sizeScale(value) + 12} style={{ fontFamily: "system-ui", fill: "#1e293b", fontSize: "11px", fontWeight: "bold" }}>
                                {name} ({value})
                            </text>
                        </Marker>
                    )
                ))}
            </ComposableMap>
        </div>
    );
}
