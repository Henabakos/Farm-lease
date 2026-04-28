import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle, Eye, Upload, BarChart3, AlertCircle } from 'lucide-react';
import { MapViewer } from './MapViewer';
import { BoundaryDrawer } from './BoundaryDrawer';
import { useGeospatial } from '@/src/hooks/useGeospatial';
import { Cluster } from '@/src/types';

interface GeospatialClusterDetailProps {
  cluster: Cluster;
}

type ViewMode = 'map' | 'draw' | 'surveys' | 'stats';

export function GeospatialClusterDetail({ cluster }: GeospatialClusterDetailProps) {
  const {
    boundaries,
    selectedBoundary,
    statistics,
    loading,
    error,
    loadBoundaries,
    loadStatistics,
    createBoundary,
    deleteBoundary,
    verifyBoundary,
    setSelectedBoundary
  } = useGeospatial(cluster.id);

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showDrawer, setShowDrawer] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadBoundaries(cluster.id);
    loadStatistics(cluster.id);
  }, [cluster.id]);

  const handleCreateBoundary = async (name: string, coordinates: any[]) => {
    const boundary = await createBoundary(name, coordinates);
    if (boundary) {
      setShowDrawer(false);
      setSelectedBoundary(boundary);
    }
  };

  const handleDeleteBoundary = async (boundaryId: string) => {
    if (confirm('Are you sure you want to delete this boundary?')) {
      await deleteBoundary(boundaryId);
    }
  };

  const handleVerifyBoundary = async (boundaryId: string) => {
    await verifyBoundary(boundaryId);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Geospatial Management - {cluster.name}
            </h2>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            disabled={showDrawer}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Boundary
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['map', 'draw', 'surveys', 'stats'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {mode === 'map' && <Eye className="w-4 h-4 inline mr-1" />}
              {mode === 'draw' && <MapPin className="w-4 h-4 inline mr-1" />}
              {mode === 'surveys' && <Upload className="w-4 h-4 inline mr-1" />}
              {mode === 'stats' && <BarChart3 className="w-4 h-4 inline mr-1" />}
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {showDrawer && !loading ? (
          <div className="h-full">
            <BoundaryDrawer
              onSave={handleCreateBoundary}
              onCancel={() => setShowDrawer(false)}
              centerLat={cluster.centerLatitude || 20}
              centerLng={cluster.centerLongitude || 0}
            />
          </div>
        ) : (
          <>
            {/* Map View */}
            {viewMode === 'map' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                <div className="lg:col-span-2 h-full">
                  <MapViewer
                    boundaries={boundaries}
                    selectedBoundary={selectedBoundary}
                    onBoundarySelect={setSelectedBoundary}
                    centerLat={cluster.centerLatitude || 20}
                    centerLng={cluster.centerLongitude || 0}
                  />
                </div>

                {/* Boundaries list */}
                <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                  <div className="border-b border-border p-3 bg-muted">
                    <p className="text-sm font-semibold text-foreground">
                      Boundaries ({boundaries.length})
                    </p>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {boundaries.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No boundaries yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {boundaries.map((boundary) => (
                          <div
                            key={boundary.id}
                            onClick={() => setSelectedBoundary(boundary)}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedBoundary?.id === boundary.id
                                ? 'bg-primary/10 border-l-2 border-l-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {boundary.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {boundary.area_hectares.toFixed(2)} ha
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {boundary.verified_at && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedBoundary && (
                    <div className="border-t border-border p-3 space-y-2">
                      {!selectedBoundary.verified_at && (
                        <button
                          onClick={() => handleVerifyBoundary(selectedBoundary.id)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBoundary(selectedBoundary.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics View */}
            {viewMode === 'stats' && (
              <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  Cluster Statistics
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : statistics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Boundaries</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {statistics.total_boundaries}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Area</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {(statistics.total_area_hectares || 0).toFixed(2)} ha
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {(statistics.avg_accuracy || 0).toFixed(1)}/5
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Verified</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {statistics.verified_count}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </div>
            )}

            {/* Surveys View */}
            {viewMode === 'surveys' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Survey Management
                </h3>
                <p className="text-muted-foreground">
                  Upload survey files to verify and enhance boundary accuracy
                </p>
                <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Select a boundary to upload survey data
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
