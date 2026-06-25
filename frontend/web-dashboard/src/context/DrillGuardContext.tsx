import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Well, Alert, Recommendation, SensorReading, ModelOutput, HistoricalEvent } from '../types';
import {
  generateWells,
  generateAlerts,
  generateRecommendations,
  generateSensorReadings,
  generateModelOutputs,
} from '../lib/mockData';

interface DrillGuardState {
  wells: Well[];
  alerts: Alert[];
  recommendations: Recommendation[];
  historicalEvents: HistoricalEvent[];
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  selectedWellId: string | null;
  sensorReadings: Record<string, SensorReading[]>;
  modelOutputs: Record<string, ModelOutput[]>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  acknowledgeAlert: (alertId: string) => void;
  markFalsePositive: (alertId: string, reason: string) => void;
  setSelectedWellId: (id: string | null) => void;
  getSensorReadings: (wellId: string) => SensorReading[];
  getModelOutputs: (wellId: string) => ModelOutput[];
  getWellAlerts: (wellId: string) => Alert[];
  getWellRecommendations: (wellId: string) => Recommendation[];
}

const DrillGuardContext = createContext<DrillGuardState | null>(null);

export function DrillGuardProvider({ children }: { children: ReactNode }) {
  const [wells] = useState<Well[]>(() => generateWells());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations] = useState<Recommendation[]>([]);
  const [historicalEvents] = useState<HistoricalEvent[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DrillGuardState['user']>(null);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [sensorReadings, setSensorReadings] = useState<Record<string, SensorReading[]>>({});
  const [modelOutputs, setModelOutputs] = useState<Record<string, ModelOutput[]>>({});

  useEffect(() => {
    setAlerts(generateAlerts(wells));
  }, [wells]);

  const login = useCallback(async (email: string, _password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (email) {
      setIsAuthenticated(true);
      setUser({ name: 'Johnpaul Eze', email, role: 'Drilling Engineer' });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString(), acknowledged_by: 'user-1' }
          : a
      )
    );
  }, []);

  const markFalsePositive = useCallback((alertId: string, reason: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'false_positive' as const, false_positive_reason: reason }
          : a
      )
    );
  }, []);

  const getSensorReadings = useCallback((wellId: string) => {
    if (!sensorReadings[wellId]) {
      const readings = generateSensorReadings(wellId);
      setSensorReadings(prev => ({ ...prev, [wellId]: readings }));
      return readings;
    }
    return sensorReadings[wellId];
  }, [sensorReadings]);

  const getModelOutputs = useCallback((wellId: string) => {
    if (!modelOutputs[wellId]) {
      const outputs = generateModelOutputs(wellId);
      setModelOutputs(prev => ({ ...prev, [wellId]: outputs }));
      return outputs;
    }
    return modelOutputs[wellId];
  }, [modelOutputs]);

  const getWellAlerts = useCallback((wellId: string) => {
    return alerts.filter(a => a.well_id === wellId);
  }, [alerts]);

  const getWellRecommendations = useCallback((wellId: string) => {
    const recs = generateRecommendations(wells);
    return recs.filter(r => r.well_id === wellId);
  }, [wells]);

  return (
    <DrillGuardContext.Provider
      value={{
        wells,
        alerts,
        recommendations,
        historicalEvents,
        isAuthenticated,
        user,
        selectedWellId,
        sensorReadings,
        modelOutputs,
        login,
        logout,
        acknowledgeAlert,
        markFalsePositive,
        setSelectedWellId,
        getSensorReadings,
        getModelOutputs,
        getWellAlerts,
        getWellRecommendations,
      }}
    >
      {children}
    </DrillGuardContext.Provider>
  );
}

export function useDrillGuard() {
  const context = useContext(DrillGuardContext);
  if (!context) throw new Error('useDrillGuard must be used within DrillGuardProvider');
  return context;
}
