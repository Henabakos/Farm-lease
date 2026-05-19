import { useState, useCallback } from 'react';
import geospatialService, { LandBoundary, LandSurvey, BoundaryStatistics } from '@/src/services/geospatial';
import { toast } from 'sonner';

export function useGeospatial(clusterId?: string) {
  const [boundaries, setBoundaries] = useState<LandBoundary[]>([]);
  const [selectedBoundary, setSelectedBoundary] = useState<LandBoundary | null>(null);
  const [surveys, setSurveys] = useState<LandSurvey[]>([]);
  const [statistics, setStatistics] = useState<BoundaryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoundaries = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await geospatialService.getBoundariesForCluster(id);
      // Extract items array from paginated response
      const boundariesArray = Array.isArray(data) ? data : data?.items || [];
      setBoundaries(boundariesArray);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boundaries';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBoundaryDetails = useCallback(async (boundaryId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await geospatialService.getBoundaryDetails(boundaryId);
      setSelectedBoundary(data);
      if (data.surveys) {
        setSurveys(data.surveys);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boundary details';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoundary = useCallback(async (
    name: string,
    coordinates: Array<{ lat: number; lng: number }>,
    description?: string,
    accuracyRating?: number
  ) => {
    if (!clusterId) {
      setError('Cluster ID required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newBoundary = await geospatialService.createBoundary(
        clusterId,
        name,
        coordinates,
        description,
        accuracyRating
      );
      setBoundaries((prev) => [newBoundary, ...prev]);
      toast.success('Boundary created successfully');
      return newBoundary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create boundary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [clusterId]);

  const updateBoundary = useCallback(async (boundaryId: string, updates: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await geospatialService.updateBoundary(boundaryId, updates);
      setBoundaries((prev) => prev.map((b) => (b.id === boundaryId ? updated : b)));
      setSelectedBoundary((prev) => (prev?.id === boundaryId ? updated : prev));
      toast.success('Boundary updated successfully');
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update boundary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBoundary = useCallback(async (boundaryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await geospatialService.deleteBoundary(boundaryId);
      setBoundaries((prev) => prev.filter((b) => b.id !== boundaryId));
      setSelectedBoundary((prev) => (prev?.id === boundaryId ? null : prev));
      toast.success('Boundary deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete boundary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyBoundary = useCallback(async (boundaryId: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const verified = await geospatialService.verifyBoundary(boundaryId, notes);
      setBoundaries((prev) => prev.map((b) => (b.id === boundaryId ? verified : b)));
      setSelectedBoundary((prev) => (prev?.id === boundaryId ? verified : prev));
      toast.success('Boundary verified successfully');
      return verified;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify boundary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadSurvey = useCallback(async (
    boundaryId: string,
    surveyType: string,
    fileUrl: string,
    fileName: string,
    fileSize: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const newSurvey = await geospatialService.uploadSurvey(
        boundaryId,
        surveyType,
        fileUrl,
        fileName,
        fileSize
      );
      setSurveys((prev) => [newSurvey, ...prev]);
      toast.success('Survey uploaded successfully');
      return newSurvey;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload survey';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const stats = await geospatialService.getClusterStatistics(id);
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    boundaries,
    selectedBoundary,
    surveys,
    statistics,
    loading,
    error,
    loadBoundaries,
    loadBoundaryDetails,
    createBoundary,
    updateBoundary,
    deleteBoundary,
    verifyBoundary,
    uploadSurvey,
    loadStatistics,
    setSelectedBoundary,
    setBoundaries,
    setSurveys,
  };
}
