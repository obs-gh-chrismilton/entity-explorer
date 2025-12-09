export interface Dataset {
  id: string;
  name: string;
  description?: string;
  label?: string;
  accelerated: boolean;
  iconUrl?: string;
  managedBy?: string;
  workspaceId?: string;
  folderId?: string;
  validFromField?: string;
  validToField?: string;
  pathCost?: number;
  stages?: DatasetStage[];
  createdDate?: string;
  updatedDate?: string;
}

export interface DatasetStage {
  id: string;
  stageNumber: number;
  input?: StageInput;
  pipeline?: string;
  layout?: StageLayout;
  outputColumns?: string[];
}

export interface StageInput {
  inputName?: string;
  datasetId?: string;
  datasetName?: string;
}

export interface StageLayout {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  createdDate?: string;
  updatedDate?: string;
  sections?: DashboardSection[];
}

export interface DashboardSection {
  id: string;
  title?: string;
  cards?: DashboardCard[];
}

export interface DashboardCard {
  id: string;
  cardType: string;
  title?: string;
  query?: string;
  datasetId?: string;
  datasetName?: string;
}

export interface Monitor {
  id: string;
  name: string;
  description?: string;
  managedBy?: string;
  lookbackTime?: string;
  inputQuery?: string;
  stage?: MonitorStage;
  createdDate?: string;
  updatedDate?: string;
}

export interface MonitorStage {
  pipeline?: string;
  datasetId?: string;
  datasetName?: string;
}

export interface Worksheet {
  id: string;
  name: string;
  description?: string;
  stages?: WorksheetStage[];
  createdDate?: string;
  updatedDate?: string;
}

export interface WorksheetStage {
  id: string;
  stageNumber: number;
  pipeline?: string;
  datasetId?: string;
  datasetName?: string;
}

export interface Relationship {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  targetId: string;
  targetName: string;
  targetType: string;
  relationshipType: string;
}

export interface SearchResult {
  entityId: string;
  entityName: string;
  entityType: string;
  matchedCode: string;
  lineNumber?: number;
  context?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  entities?: string[];
}

export interface ConnectionConfig {
  url: string;
  username: string;
  password?: string;
  token?: string;
}

export interface Stats {
  totalDatasets: number;
  totalDashboards: number;
  totalMonitors: number;
  totalWorksheets: number;
}
