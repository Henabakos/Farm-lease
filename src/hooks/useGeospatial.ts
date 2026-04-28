import { useState, useCallback } from 'react';
import geospatialService, { LandBoundary, LandSurvey, BoundaryStatistics } from '@/src/services/geospatial';
import { useNotification } from '@/src/contexts/NotificationContext';

export function useGeospatial(clusterId?: string) {
  const { notify } = useNotification();
  const [boundaries, setBoundaries] = useState<LandBoundary[]>([]);
  const [selectedBoundary, setSelectedBoundary] = useState<LandBoundary | null>(null);
  const [surveys, setSurveys] = useState<LandSurvey[]>([]);
  const [statistics, setStatistics] = useState<BoundaryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load boundaries for cluster
  const loadBoundaries = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await geospatialService.getBoundariesForCluster(id);
      setBoundaries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boundaries';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Load boundary details
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
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Create boundary
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
      setBoundaries([newBoundary, ...boundaries]);
      notify({
        type: 'success',
        title: 'Success',
        description: 'Boundary created successfully'
      });
      return newBoundary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create boundary';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [clusterId, boundaries, notify]);

  // Update boundary
  const updateBoundary = useCallback(async (
    boundaryId: string,
    updates: any
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await geospatialService.updateBoundary(boundaryId, updates);
      setBoundaries(boundaries.map(b => b.id === boundaryId ? updated : b));
      if (selectedBoundary?.id === boundaryId) {
        setSelectedBoundary(updated);
      }
      notify({
        type: 'success',
        title: 'Success',
        description: 'Boundary updated successfully'
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update boundary';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [boundaries, selectedBoundary, notify]);

  // Delete boundary
  const deleteBoundary = useCallback(async (boundaryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await geospatialService.deleteBoundary(boundaryId);
      setBoundaries(boundaries.filter(b => b.id !== boundaryId));
      if (selectedBoundary?.id === boundaryId) {
        setSelectedBoundary(null);
      }
      notify({
        type: 'success',
        title: 'Success',
        description: 'Boundary deleted successfully'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete boundary';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [boundaries, selectedBoundary, notify]);

  // Verify boundary
  const verifyBoundary = useCallback(async (boundaryId: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const verified = await geospatialService.verifyBoundary(boundaryId, notes);
      setBoundaries(boundaries.map(b => b.id === boundaryId ? verified : b));
      if (selectedBoundary?.id === boundaryId) {
        setSelectedBoundary(verified);
      }
      notify({
        type: 'success',
        title: 'Success',
        description: 'Boundary verified successfully'
      });
      return verified;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify boundary';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [boundaries, selectedBoundary, notify]);

  // Upload survey
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
      setSurveys([newSurvey, ...surveys]);
      notify({
        type: 'success',
        title: 'Success',
        description: 'Survey uploaded successfully'
      });
      return newSurvey;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload survey';
      setError(message);
      notify({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setLoading(false);
    }
  }, [surveys, notify]);

  // Load statistics
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
    // State
    boundaries,
    selectedBoundary,
    surveys,
    statistics,
    loading,
    error,

    // Actions
    loadBoundaries,
    loadBoundaryDetails,
    createBoundary,
    updateBoundary,
    deleteBoundary,
    verifyBoundary,
    uploadSurvey,
    loadStatistics,

    // Utilities
    setSelectedBoundary,
    setBoundaries,
    setSurveys
  };
}
