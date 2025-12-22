// TypeScript interfaces and types for the Entity Explorer application

export interface ObsUser {
  id: string;
  email: string;
  name: string;
  label?: string;
}

export interface ObsFieldDefinition {
  name: string;
  type: string;
  description?: string;
  isEnum?: boolean;
  isMetric?: boolean;
  isRepeated?: boolean;
}

export interface ObsParameter {
  name: string;
  type: string;
  defaultValue?: any;
  description?: string;
}

export interface ObsStage {
  id: string;
  index: number;
  input?: string;
  pipeline: string;
  outputColumns?: ObsFieldDefinition[];
  params?: ObsParameter[];
}

export interface ObsDataset {
  id: string;
  name: string;
  label: string;
  description?: string;
  iconUrl?: string;
  folderId?: string;
  stages?: ObsStage[];
  inputDataset?: string;
  managedBy?: string;
  createdBy?: ObsUser;
  createdDate?: string;
  updatedBy?: ObsUser;
  updatedDate?: string;
}

export interface ObsDashboard {
  id: string;
  name: string;
  label: string;
  description?: string;
  iconUrl?: string;
  folderId?: string;
  layout?: any;
  createdBy?: ObsUser;
  createdDate?: string;
  updatedBy?: ObsUser;
  updatedDate?: string;
}

export interface ObsMonitor {
  id: string;
  name: string;
  label: string;
  description?: string;
  iconUrl?: string;
  folderId?: string;
  stage?: ObsStage;
  lookbackTime?: string;
  dataStabilizationDelay?: string;
  inputQuery?: string;
  createdBy?: ObsUser;
  createdDate?: string;
  updatedBy?: ObsUser;
  updatedDate?: string;
  managedBy?: string;
}

export interface ObsWorksheet {
  id: string;
  name: string;
  label: string;
  description?: string;
  iconUrl?: string;
  folderId?: string;
  stages?: ObsStage[];
  createdBy?: ObsUser;
  createdDate?: string;
  updatedBy?: ObsUser;
  updatedDate?: string;
}

export interface ObsMetric {
  id: string;
  name: string;
  label: string;
  description?: string;
  iconUrl?: string;
  createdBy?: ObsUser;
  createdDate?: string;
  updatedBy?: ObsUser;
  updatedDate?: string;
}

export interface ObsRelationship {
  source: {
    id: string;
    type: 'dataset' | 'dashboard' | 'monitor' | 'worksheet' | 'metric';
    name: string;
  };
  target: {
    id: string;
    type: 'dataset' | 'dashboard' | 'monitor' | 'worksheet' | 'metric';
    name: string;
  };
  relationshipType: 'uses' | 'derives_from' | 'references' | 'monitors';
}

export interface EnvironmentSummary {
  totalDatasets: number;
  totalDashboards: number;
  totalMonitors: number;
  totalWorksheets: number;
  totalMetrics: number;
  recentlyUpdated: Array<{
    id: string;
    name: string;
    type: string;
    updatedDate: string;
  }>;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  relatedEntities?: Array<{
    id: string;
    type: string;
    name: string;
    relevance: string;
  }>;
}

export interface SessionData {
  userId?: string;
  observeToken?: string;
  observeUrl?: string;
  user?: ObsUser;
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    observeToken?: string;
    observeUrl?: string;
    user?: ObsUser;
  }
}
