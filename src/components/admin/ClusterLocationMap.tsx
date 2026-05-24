import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGeospatial } from "@/src/hooks/useGeospatial";
import type { Cluster } from "@/src/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface ClusterLocationMapProps {
    cluster: Cluster;
    className?: string;
}

const DEFAULT_CENTER: [number, number] = [9.03, 38.74];

function hasValidCoords(lat?: number, lng?: number) {
    return (
        lat != null &&
        lng != null &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !(lat === 0 && lng === 0)
    );
}

export const ClusterLocationMap: React.FC<ClusterLocationMapProps> = ({
    cluster,
    className,
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const { boundaries, loadBoundaries } = useGeospatial(cluster.id);

    const lat = cluster.centerLatitude;
    const lng = cluster.centerLongitude;
    const hasCoords = hasValidCoords(lat, lng);

    useEffect(() => {
        loadBoundaries(cluster.id);
    }, [cluster.id, loadBoundaries]);

    useEffect(() => {
        if (!mapContainer.current) return;

        const center: [number, number] = hasCoords
            ? [lat!, lng!]
            : DEFAULT_CENTER;
        const zoom = hasCoords ? 12 : 6;

        if (!mapRef.current) {
            mapRef.current = L.map(mapContainer.current).setView(center, zoom);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(mapRef.current);
        } else {
            mapRef.current.setView(center, zoom);
        }

        layersRef.current.forEach((layer) =>
            mapRef.current?.removeLayer(layer),
        );
        layersRef.current = [];

        if (hasCoords) {
            const marker = L.circleMarker([lat!, lng!], {
                radius: 10,
                color: "#059669",
                weight: 2,
                fillColor: "#10b981",
                fillOpacity: 0.85,
            }).addTo(mapRef.current);
            marker.bindPopup(
                `<div class="p-1"><strong>${cluster.name}</strong><br/><span class="text-xs">${cluster.location}</span></div>`,
            );
            layersRef.current.push(marker);
        }

        const colors = [
            "#3b82f6",
            "#8b5cf6",
            "#f97316",
            "#06b6d4",
        ];
        boundaries.forEach((boundary, index) => {
            if (!boundary.coordinates?.length) return;
            const coords = boundary.coordinates.map(
                (c) => [c.lat, c.lng] as [number, number],
            );
            const polygon = L.polygon(coords, {
                color: colors[index % colors.length],
                weight: 2,
                fillOpacity: 0.2,
            }).addTo(mapRef.current!);
            polygon.bindPopup(
                `<div class="p-1"><strong>${boundary.name}</strong><br/><span class="text-xs">${Number(boundary.area_hectares).toFixed(2)} ha</span></div>`,
            );
            layersRef.current.push(polygon);
        });

        if (layersRef.current.length > 1) {
            const group = L.featureGroup(layersRef.current);
            try {
                mapRef.current.fitBounds(group.getBounds().pad(0.15));
            } catch {
                // ignore invalid bounds
            }
        }

        return () => {
            // keep map instance for re-renders
        };
    }, [
        cluster.id,
        cluster.name,
        cluster.location,
        lat,
        lng,
        hasCoords,
        boundaries,
    ]);

    return (
        <div
            className={cn(
                "rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm",
                className,
            )}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Cluster Location
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {cluster.location}
                            {cluster.region ? ` · ${cluster.region}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasCoords ? (
                        <Badge
                            variant="outline"
                            className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                            {lat!.toFixed(4)}, {lng!.toFixed(4)}
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200"
                        >
                            No coordinates set
                        </Badge>
                    )}
                    {boundaries.length > 0 && (
                        <Badge
                            variant="outline"
                            className="text-[9px] font-bold uppercase tracking-wider"
                        >
                            {boundaries.length} boundar
                            {boundaries.length === 1 ? "y" : "ies"}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="relative h-72 w-full bg-slate-100">
                <div ref={mapContainer} className="absolute inset-0 z-0" />
                {!hasCoords && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center border border-slate-200 shadow-sm max-w-xs mx-4">
                            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-600">
                                Set center latitude and longitude in cluster
                                info to pin the exact location on the map.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
