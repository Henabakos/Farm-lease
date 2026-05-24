import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, MapPin, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DEFAULT_CENTER: [number, number] = [9.03, 38.74];
const DEFAULT_ZOOM = 6;

export interface ClusterCoordinates {
    latitude?: number;
    longitude?: number;
}

function isValidCoord(lat?: number, lng?: number) {
    return (
        lat != null &&
        lng != null &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

interface ClusterLocationPickerProps {
    latitude?: number;
    longitude?: number;
    onChange: (coords: ClusterCoordinates) => void;
    className?: string;
}

export function ClusterLocationPicker({
    latitude,
    longitude,
    onChange,
    className,
}: ClusterLocationPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.CircleMarker | null>(null);
    const [locating, setLocating] = useState(false);

    const hasCoords = isValidCoord(latitude, longitude);

    // Initialize map + click handler
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = L.map(mapContainer.current, {
            center: hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER,
            zoom: hasCoords ? 12 : DEFAULT_ZOOM,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 19,
        }).addTo(map);

        map.on("click", (e) => {
            onChange({
                latitude: Math.round(e.latlng.lat * 1e6) / 1e6,
                longitude: Math.round(e.latlng.lng * 1e6) / 1e6,
            });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Sync marker when coordinates change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
        }

        if (hasCoords) {
            markerRef.current = L.circleMarker([latitude!, longitude!], {
                radius: 10,
                color: "#059669",
                weight: 2,
                fillColor: "#10b981",
                fillOpacity: 0.9,
            }).addTo(map);
            map.setView([latitude!, longitude!], Math.max(map.getZoom(), 12), {
                animate: true,
            });
        }
    }, [latitude, longitude, hasCoords]);

    const handleLatInput = (value: string) => {
        const lat = value === "" ? undefined : Number(value);
        onChange({
            latitude: lat,
            longitude: longitude,
        });
    };

    const handleLngInput = (value: string) => {
        const lng = value === "" ? undefined : Number(value);
        onChange({
            latitude: latitude,
            longitude: lng,
        });
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported in this browser");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange({
                    latitude:
                        Math.round(pos.coords.latitude * 1e6) / 1e6,
                    longitude:
                        Math.round(pos.coords.longitude * 1e6) / 1e6,
                });
                setLocating(false);
                toast.success("Location detected");
            },
            () => {
                setLocating(false);
                toast.error(
                    "Could not detect location. Click the map or enter coordinates manually.",
                );
            },
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    const handleClear = () => {
        onChange({ latitude: undefined, longitude: undefined });
    };

    const handleOpenMaps = () => {
        if (!hasCoords) {
            toast.info("Set a location on the map first");
            return;
        }
        window.open(
            `https://www.google.com/maps?q=${latitude},${longitude}`,
            "_blank",
            "noopener",
        );
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Map center (geolocation)
                </Label>
                <span className="text-[10px] text-slate-400 font-medium">
                    Click map to place pin
                </span>
            </div>

            <div className="relative h-44 w-full rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                <div ref={mapContainer} className="absolute inset-0 z-0" />
                {!hasCoords && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/80 px-3 py-1.5 rounded-md border border-slate-200">
                            Click anywhere to set location
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Latitude
                    </Label>
                    <Input
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        value={latitude ?? ""}
                        onChange={(e) => handleLatInput(e.target.value)}
                        placeholder="e.g. 9.03"
                        className="h-9 rounded-md text-xs border-slate-200"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Longitude
                    </Label>
                    <Input
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        value={longitude ?? ""}
                        onChange={(e) => handleLngInput(e.target.value)}
                        placeholder="e.g. 38.74"
                        className="h-9 rounded-md text-xs border-slate-200"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={locating}
                    onClick={handleUseMyLocation}
                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200 gap-1"
                >
                    {locating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Crosshair className="w-3 h-3" />
                    )}
                    Use my location
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenMaps}
                    disabled={!hasCoords}
                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200 gap-1"
                >
                    <MapPin className="w-3 h-3" />
                    Open in Maps
                </Button>
                {hasCoords && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-500 gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}
