import { create } from 'zustand';
import { Dataset, Dashboard, Monitor } from '../types';

interface EntitiesState {
  datasets: Dataset[];
  dashboards: Dashboard[];
  monitors: Monitor[];
  loading: boolean;
  error: string | null;
  setDatasets: (datasets: Dataset[]) => void;
  setDashboards: (dashboards: Dashboard[]) => void;
  setMonitors: (monitors: Monitor[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEntitiesStore = create<EntitiesState>((set) => ({
  datasets: [],
  dashboards: [],
  monitors: [],
  loading: false,
  error: null,
  setDatasets: (datasets) => set({ datasets }),
  setDashboards: (dashboards) => set({ dashboards }),
  setMonitors: (monitors) => set({ monitors }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
