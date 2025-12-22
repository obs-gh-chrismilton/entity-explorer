// Observe GraphQL client for interacting with Observe API

import axios, { AxiosInstance } from 'axios';
import {
  ObsDataset,
  ObsDashboard,
  ObsMonitor,
  ObsWorksheet,
  ObsMetric,
  ObsRelationship,
  ObsUser,
} from '../types';

export class ObserveClient {
  private baseUrl: string;
  private token: string;
  private axiosInstance: AxiosInstance;
  private customerId?: string;
  private workspaceId?: string; // Actual workspace ID for queries (different from customerId)

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;

    // Extract customer ID from URL (e.g., https://156247313073.observeinc.com -> 156247313073)
    const urlMatch = this.baseUrl.match(/https?:\/\/(\d+)\.observe/);
    if (urlMatch) {
      this.customerId = urlMatch[1];
    }

    // Format auth header: Bearer {customerId} {token} (if we have both)
    const authHeader = this.customerId && this.token
      ? `Bearer ${this.customerId} ${this.token}`
      : this.token ? `Bearer ${this.token}` : '';

    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/v1/`,
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async authenticate(username?: string, password?: string): Promise<ObsUser> {
    try {
      // If username/password provided, get a token first
      if (username && password) {
        console.log(`DEBUG authenticate - starting with email: ${username}`);

        const loginResponse = await axios.post(
          `${this.baseUrl}/v1/login`,
          { user_email: username, user_password: password },
          { timeout: 10000 }
        );

        // Debug: Log the login response structure
        console.log('Login response status:', loginResponse.status);
        console.log('Login response data:', JSON.stringify(loginResponse.data, null, 2));
        console.log(`DEBUG authenticate - login response customerId: ${loginResponse.data.customer_id}`);

        // Try different possible token field names (Observe uses access_key)
        this.token = loginResponse.data.access_key ||
                     loginResponse.data.accessToken ||
                     loginResponse.data.access_token ||
                     loginResponse.data.token ||
                     loginResponse.data.data?.accessToken ||
                     loginResponse.data.data?.access_token;

        // Capture the customer_id (required for Observe API auth)
        if (loginResponse.data.customer_id) {
          this.customerId = String(loginResponse.data.customer_id);
        }

        console.log('Extracted token:', this.token ? `Found (${this.token.substring(0, 20)}...)` : 'NOT FOUND');
        console.log('Customer ID:', this.customerId || 'NOT FOUND');
        console.log(`DEBUG authenticate - this.customerId set to: ${this.customerId}`);

        if (!this.token) {
          throw new Error('Login succeeded but no token found in response. Response keys: ' + Object.keys(loginResponse.data).join(', '));
        }

        // Observe expects: Authorization: Bearer {customer_id} {access_key}
        const authHeader = this.customerId
          ? `Bearer ${this.customerId} ${this.token}`
          : `Bearer ${this.token}`;

        console.log('Auth header format:', authHeader.substring(0, 30) + '...');
        console.log(`DEBUG authenticate - auth header: Bearer ${this.customerId} ${this.token.substring(0, 10)}...`);

        this.axiosInstance.defaults.headers['Authorization'] = authHeader;
      }

      // Get current user
      const user = await this.getCurrentUser();
      return user;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<ObsUser> {
    const query = `
      query GetCurrentUser {
        currentUser {
          id
          type
          email
          label
          timezone
          status
          role
          customer {
            id
            label
          }
          workspaces {
            id
            label
          }
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    const user = response.data.currentUser;

    // Extract customer ID from user ID (format: customerId/userId)
    if (user.id && user.id.includes('/')) {
      this.customerId = user.id.split('/')[0];
    }

    // Also get customer ID from the customer object if available
    if (user.customer?.id) {
      this.customerId = user.customer.id;
    }

    // Get the first workspace ID (this is what we need for queries)
    if (user.workspaces && user.workspaces.length > 0) {
      this.workspaceId = user.workspaces[0].id;
      console.log(`DEBUG getCurrentUser - workspaceId set to: ${this.workspaceId}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.label || user.email,
      label: user.label,
    };
  }

  async getAllDatasets(): Promise<ObsDataset[]> {
    const query = `
      query DatasetSearch {
        datasetSearch {
          dataset {
            ... on WorkspaceObject {
              id
              name
              description
              workspaceId
              managedById
            }
            ... on FolderObject {
              folderId
            }
            ... on AuditedObject {
              createdDate
              updatedDate
              createdByInfo {
                userId
                userLabel
              }
              updatedByInfo {
                userId
                userLabel
              }
            }
            ... on AccelerableObject {
              accelerationDisabled
            }
          }
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    const datasets = response.data.datasetSearch || [];

    // Transform to match ObsDataset interface
    return datasets.map((item: any) => ({
      id: item.dataset.id,
      name: item.dataset.name,
      label: item.dataset.name, // Use name as label
      description: item.dataset.description,
      iconUrl: undefined, // Not available in this query
      folderId: item.dataset.folderId,
      managedBy: item.dataset.managedById,
      stages: [], // Datasets don't support stages query via IWorksheetLike interface
      createdBy: item.dataset.createdByInfo ? {
        id: item.dataset.createdByInfo.userId,
        email: '',
        label: item.dataset.createdByInfo.userLabel,
      } : undefined,
      createdDate: item.dataset.createdDate,
      updatedBy: item.dataset.updatedByInfo ? {
        id: item.dataset.updatedByInfo.userId,
        email: '',
        label: item.dataset.updatedByInfo.userLabel,
      } : undefined,
      updatedDate: item.dataset.updatedDate,
    }));
  }

  async getAllDashboards(): Promise<ObsDashboard[]> {
    console.log(`DEBUG getAllDashboards - customerId: ${this.customerId}, workspaceId: ${this.workspaceId}, baseUrl: ${this.baseUrl}`);

    const query = `
      query DashboardSearch($terms: DWSearchInput!, $maxCount: Int64) {
        dashboardSearch(terms: $terms, maxCount: $maxCount) {
          dashboards {
            dashboard {
              ... on WorkspaceObject {
                id
                name
                description
                iconUrl
                workspaceId
                managedById
                __typename
              }
              ... on FolderObject {
                folderId
                __typename
              }
              ... on AuditedObject {
                createdDate
                createdByInfo {
                  userId
                  userLabel
                  userTimezone
                  __typename
                }
                updatedDate
                updatedByInfo {
                  userId
                  userLabel
                  userTimezone
                  __typename
                }
                __typename
              }
              ... on IWorksheetLike {
                parameters {
                  id
                  name
                  defaultValue {
                    bool
                    float64
                    int64
                    string
                    timestamp
                    duration
                    __typename
                  }
                  valueKind {
                    type
                    arrayItemType {
                      keyForDatasetId
                    }
                    keyForDatasetId
                    __typename
                  }
                  __typename
                }
                parameterValues {
                  id
                  value {
                    bool
                    float64
                    int64
                    string
                    timestamp
                    duration
                    __typename
                  }
                  __typename
                }
                stages {
                  id
                  params
                  pipeline
                  layout
                  input {
                    inputName
                    inputRole
                    datasetId
                    datasetPath
                    stageId
                    __typename
                  }
                  __typename
                }
                layout
              }
              defaultForDatasets
              effectiveSettings {
                scanner {
                  powerLevel
                  __typename
                }
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `;

    const variables = { terms: { workspaceId: [this.workspaceId] } };
    console.log("DEBUG getAllDashboards - variables being sent:", JSON.stringify(variables, null, 2));

    const response = await this.graphqlQuery(query, variables);
    console.log("DEBUG getAllDashboards - workspaceId used:", this.workspaceId);
    console.log("DEBUG getAllDashboards - response:", JSON.stringify(response.data, null, 2).substring(0, 1000));
    console.log("DEBUG getAllDashboards - dashboards count:", (response.data.dashboardSearch?.dashboards || []).length);
    const dashboards = response.data.dashboardSearch?.dashboards || [];

    // Transform to match ObsDashboard interface
    return dashboards.map((item: any) => ({
      id: item.dashboard.id,
      name: item.dashboard.name,
      label: item.dashboard.name, // Use name as label
      description: item.dashboard.description,
      iconUrl: item.dashboard.iconUrl,
      folderId: item.dashboard.folderId,
      layout: item.dashboard.layout,
      stages: item.dashboard.stages?.map((stage: any) => ({
        id: stage.id,
        params: stage.params,
        pipeline: stage.pipeline,
        layout: stage.layout,
        input: stage.input ? {
          inputName: stage.input.inputName,
          inputRole: stage.input.inputRole,
          datasetId: stage.input.datasetId,
          datasetPath: stage.input.datasetPath,
          stageId: stage.input.stageId,
        } : undefined,
      })) || [],
      createdBy: item.dashboard.createdByInfo ? {
        id: item.dashboard.createdByInfo.userId,
        email: '',
        label: item.dashboard.createdByInfo.userLabel,
      } : undefined,
      createdDate: item.dashboard.createdDate,
      updatedBy: item.dashboard.updatedByInfo ? {
        id: item.dashboard.updatedByInfo.userId,
        email: '',
        label: item.dashboard.updatedByInfo.userLabel,
      } : undefined,
      updatedDate: item.dashboard.updatedDate,
    }));
  }

  async getAllMonitors(): Promise<ObsMonitor[]> {
    console.log(`DEBUG getAllMonitors - customerId: ${this.customerId}, workspaceId: ${this.workspaceId}, baseUrl: ${this.baseUrl}`);

    if (!this.workspaceId) {
      console.error('No workspace ID available for monitors query');
      return [];
    }

    const query = `
      query MonitorSearchInWorkspace($workspaceId: ObjectId!) {
        monitorsInWorkspace(workspaceId: $workspaceId) {
          ... on WorkspaceObject {
            id
            name
            description
            iconUrl
            workspaceId
            managedById
            managedBy {
              id
              name
              description
              iconUrl
              workspaceId
              managedById
              __typename
            }
            __typename
          }
          ... on AuditedObject {
            createdDate
            createdByInfo {
              userId
              userLabel
              userTimezone
              __typename
            }
            updatedDate
            updatedByInfo {
              userId
              userLabel
              userTimezone
              __typename
            }
            __typename
          }
          comment
          isTemplate
          source
          resourceInputLinkName
          useDefaultFreshness
          effectiveSettings {
            monitor {
              freshnessGoal
              __typename
            }
            scanner {
              powerLevel
              __typename
            }
          }
          notificationSpec {
            importance
            merge
            reminderFrequency
            notifyOnReminder
            notifyOnClose
            __typename
          }
          activeMonitorInfo {
            accelerationDisabled
            accelerationInfo {
              state
              stalenessSeconds
              alwaysAccelerated
              configuredTargetStalenessSeconds
              targetStalenessSeconds
              effectiveTargetStalenessSeconds
              rateLimitOverrideTargetStalenessSeconds
              acceleratedRanges {
                start
                end
                __typename
              }
              targetAcceleratedRanges {
                start
                end
                __typename
              }
              freshnessTime
              minimumDownstreamTargetStaleness {
                minimumDownstreamTargetStalenessSeconds
                datasetIds
                monitorIds
                shareIds
                __typename
              }
              effectiveOnDemandMaterializationLength
              errors {
                datasetId
                datasetName
                transformId
                time
                errorText
                __typename
              }
              __typename
            }
            statusInfo {
              status
              errors {
                errorText
                __typename
              }
              __typename
            }
            generatedDatasetIds {
              role
              datasetId
              __typename
            }
            notificationInfo {
              lookbackTime
              count
              __typename
            }
            __typename
          }
          rule {
            ruleKind
            layout
            sourceColumn
            groupByGroups {
              columns
              groupName
              columnPath {
                column
                path
                __typename
              }
              __typename
            }
            __typename
          }
          actions {
            id
            name
            description
            iconUrl
            workspaceId
            createdDate
            createdByInfo {
              userId
              userLabel
              userTimezone
              __typename
            }
            updatedDate
            updatedByInfo {
              userId
              userLabel
              userTimezone
              __typename
            }
            rateLimit
            notifyOnClose
            notifyOnReminder
            monitors {
              id
            }
            __typename
          }
          query {
            outputStage
            stages {
              id
              params
              pipeline
              layout
              input {
                inputName
                inputRole
                datasetId
                datasetPath
                stageId
                __typename
              }
              __typename
            }
            layout
            __typename
          }
          __typename
        }
      }
    `;

    const variables = { workspaceId: this.workspaceId };
    console.log("DEBUG getAllMonitors - variables being sent:", JSON.stringify(variables, null, 2));

    try {
      const response = await this.graphqlQuery(query, variables);
      console.log("DEBUG getAllMonitors - workspaceId used:", this.workspaceId);
      console.log("DEBUG getAllMonitors - response:", JSON.stringify(response.data, null, 2).substring(0, 1000));
      console.log("DEBUG getAllMonitors - monitors count:", (response.data.monitorsInWorkspace || []).length);
      const monitors = response.data.monitorsInWorkspace || [];

      // Transform to match ObsMonitor interface
      return monitors.map((monitor: any) => {
        // Extract the output stage from the query stages
        let outputStage = undefined;
        if (monitor.query?.stages && monitor.query?.outputStage) {
          const stageData = monitor.query.stages.find((s: any) => s.id === monitor.query.outputStage);
          if (stageData) {
            outputStage = {
              id: stageData.id,
              params: stageData.params,
              pipeline: stageData.pipeline,
              layout: stageData.layout,
              input: stageData.input ? {
                inputName: stageData.input.inputName,
                inputRole: stageData.input.inputRole,
                datasetId: stageData.input.datasetId,
                datasetPath: stageData.input.datasetPath,
                stageId: stageData.input.stageId,
              } : undefined,
            };
          }
        }

        return {
          id: monitor.id,
          name: monitor.name,
          label: monitor.name, // Use name as label
          description: monitor.description,
          iconUrl: monitor.iconUrl,
          folderId: undefined, // Not available in this query
          stage: outputStage,
          lookbackTime: monitor.activeMonitorInfo?.notificationInfo?.lookbackTime,
          dataStabilizationDelay: undefined,
          inputQuery: undefined,
          managedBy: monitor.managedById,
          createdBy: monitor.createdByInfo ? {
            id: monitor.createdByInfo.userId,
            email: '',
            label: monitor.createdByInfo.userLabel,
          } : undefined,
          createdDate: monitor.createdDate,
          updatedBy: monitor.updatedByInfo ? {
            id: monitor.updatedByInfo.userId,
            email: '',
            label: monitor.updatedByInfo.userLabel,
          } : undefined,
          updatedDate: monitor.updatedDate,
          rule: monitor.rule ? {
            ruleKind: monitor.rule.ruleKind,
            layout: monitor.rule.layout,
            sourceColumn: monitor.rule.sourceColumn,
            groupByGroups: monitor.rule.groupByGroups,
          } : undefined,
          targetDataset: undefined, // targetDataset field not available in AccelerationInfo
        };
      });
    } catch (error) {
      console.error('Error fetching monitors:', error);
      return [];
    }
  }

  async getAllWorksheets(): Promise<ObsWorksheet[]> {
    const query = `
      query WorksheetSearch($terms: DWSearchInput!, $maxCount: Int64) {
        worksheetSearch(terms: $terms, maxCount: $maxCount) {
          worksheets {
            worksheet {
              ... on WorkspaceObject {
                id
                name
                description
                workspaceId
              }
              ... on FolderObject {
                folderId
              }
              ... on AuditedObject {
                createdDate
                updatedDate
                createdByInfo {
                  userId
                  userLabel
                }
                updatedByInfo {
                  userId
                  userLabel
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.graphqlQuery(query, {
      terms: { workspaceId: [this.workspaceId] },
      maxCount: "1000"
    });
    const worksheets = response.data.worksheetSearch?.worksheets || [];

    // Transform to match ObsWorksheet interface
    return worksheets.map((item: any) => ({
      id: item.worksheet.id,
      name: item.worksheet.name,
      label: item.worksheet.name, // Use name as label
      description: item.worksheet.description,
      iconUrl: undefined, // Not available in this query
      folderId: item.worksheet.folderId,
      stages: [], // Not available in this query
      createdBy: item.worksheet.createdByInfo ? {
        id: item.worksheet.createdByInfo.userId,
        email: '',
        label: item.worksheet.createdByInfo.userLabel,
      } : undefined,
      createdDate: item.worksheet.createdDate,
      updatedBy: item.worksheet.updatedByInfo ? {
        id: item.worksheet.updatedByInfo.userId,
        email: '',
        label: item.worksheet.updatedByInfo.userLabel,
      } : undefined,
      updatedDate: item.worksheet.updatedDate,
    }));
  }

  // Note: The 'metrics' query doesn't exist in the Observe GraphQL API.
  // Metrics are typically queried via metricSearch with a match pattern.
  // For now, this method returns an empty array. If needed, implement metricSearch.
  async getAllMetrics(): Promise<ObsMetric[]> {
    console.log('getAllMetrics: Not implemented - metrics query does not exist in Observe API');
    return [];
  }

  async getRelationships(): Promise<ObsRelationship[]> {
    const relationships: ObsRelationship[] = [];

    try {
      // Get all entities
      const [datasets, dashboards, monitors, worksheets] = await Promise.all([
        this.getAllDatasets(),
        this.getAllDashboards(),
        this.getAllMonitors(),
        this.getAllWorksheets(),
      ]);

      // Build relationships from dataset stages (input references)
      datasets.forEach(dataset => {
        if (dataset.stages) {
          dataset.stages.forEach(stage => {
            if (stage.input) {
              // Find the input dataset
              const inputDataset = datasets.find(d => d.id === stage.input || d.name === stage.input);
              if (inputDataset) {
                relationships.push({
                  source: {
                    id: dataset.id,
                    type: 'dataset',
                    name: dataset.name,
                  },
                  target: {
                    id: inputDataset.id,
                    type: 'dataset',
                    name: inputDataset.name,
                  },
                  relationshipType: 'derives_from',
                });
              }
            }

            // Look for dataset references in pipeline OPAL code
            if (stage.pipeline) {
              const datasetRefs = this.extractDatasetReferences(stage.pipeline);
              datasetRefs.forEach(refName => {
                const refDataset = datasets.find(d => d.name === refName);
                if (refDataset && refDataset.id !== dataset.id) {
                  relationships.push({
                    source: {
                      id: dataset.id,
                      type: 'dataset',
                      name: dataset.name,
                    },
                    target: {
                      id: refDataset.id,
                      type: 'dataset',
                      name: refDataset.name,
                    },
                    relationshipType: 'uses',
                  });
                }
              });
            }
          });
        }
      });

      // Build relationships from monitors
      monitors.forEach(monitor => {
        if (monitor.stage?.input) {
          const inputDataset = datasets.find(d => d.id === monitor.stage?.input || d.name === monitor.stage?.input);
          if (inputDataset) {
            relationships.push({
              source: {
                id: monitor.id,
                type: 'monitor',
                name: monitor.name,
              },
              target: {
                id: inputDataset.id,
                type: 'dataset',
                name: inputDataset.name,
              },
              relationshipType: 'monitors',
            });
          }
        }

        // Look for dataset references in monitor pipeline
        if (monitor.stage?.pipeline) {
          const datasetRefs = this.extractDatasetReferences(monitor.stage.pipeline);
          datasetRefs.forEach(refName => {
            const refDataset = datasets.find(d => d.name === refName);
            if (refDataset) {
              relationships.push({
                source: {
                  id: monitor.id,
                  type: 'monitor',
                  name: monitor.name,
                },
                target: {
                  id: refDataset.id,
                  type: 'dataset',
                  name: refDataset.name,
                },
                relationshipType: 'uses',
              });
            }
          });
        }
      });

      // Build relationships from worksheets
      worksheets.forEach(worksheet => {
        if (worksheet.stages) {
          worksheet.stages.forEach(stage => {
            if (stage.input) {
              const inputDataset = datasets.find(d => d.id === stage.input || d.name === stage.input);
              if (inputDataset) {
                relationships.push({
                  source: {
                    id: worksheet.id,
                    type: 'worksheet',
                    name: worksheet.name,
                  },
                  target: {
                    id: inputDataset.id,
                    type: 'dataset',
                    name: inputDataset.name,
                  },
                  relationshipType: 'uses',
                });
              }
            }

            // Look for dataset references in worksheet pipeline
            if (stage.pipeline) {
              const datasetRefs = this.extractDatasetReferences(stage.pipeline);
              datasetRefs.forEach(refName => {
                const refDataset = datasets.find(d => d.name === refName);
                if (refDataset) {
                  relationships.push({
                    source: {
                      id: worksheet.id,
                      type: 'worksheet',
                      name: worksheet.name,
                    },
                    target: {
                      id: refDataset.id,
                      type: 'dataset',
                      name: refDataset.name,
                    },
                    relationshipType: 'uses',
                  });
                }
              });
            }
          });
        }
      });

      // Deduplicate relationships
      const uniqueRelationships = this.deduplicateRelationships(relationships);
      return uniqueRelationships;
    } catch (error) {
      console.error('Error building relationships:', error);
      return [];
    }
  }

  private extractDatasetReferences(pipeline: string): string[] {
    const refs: string[] = [];

    // Look for @datasetName patterns
    const atPattern = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = atPattern.exec(pipeline)) !== null) {
      refs.push(match[1]);
    }

    // Look for interface() and dataset() function calls
    const interfacePattern = /(?:interface|dataset)\s*\(\s*["']([^"']+)["']/g;
    while ((match = interfacePattern.exec(pipeline)) !== null) {
      refs.push(match[1]);
    }

    return [...new Set(refs)]; // Remove duplicates
  }

  private deduplicateRelationships(relationships: ObsRelationship[]): ObsRelationship[] {
    const seen = new Set<string>();
    return relationships.filter(rel => {
      const key = `${rel.source.id}:${rel.target.id}:${rel.relationshipType}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async graphqlQuery(query: string, variables?: any): Promise<any> {
    try {
      // Get the authorization header for logging (truncate token for safety)
      const authHeader = this.axiosInstance.defaults.headers['Authorization'] as string || 'NOT SET';
      const truncatedAuthHeader = authHeader.length > 40
        ? authHeader.substring(0, 40) + '...'
        : authHeader;

      console.log('DEBUG graphqlQuery - Request details:');
      console.log('  URL:', `${this.baseUrl}/v1/meta`);
      console.log('  Authorization header:', truncatedAuthHeader);
      console.log('  Variables:', JSON.stringify(variables, null, 2));

      const response = await this.axiosInstance.post('meta', {
        query,
        variables,
      });

      console.log('DEBUG graphqlQuery - Response status:', response.status);
      console.log('DEBUG graphqlQuery - Response data (first 500 chars):',
        JSON.stringify(response.data, null, 2).substring(0, 500));

      if (response.data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `GraphQL request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw error;
    }
  }

  getToken(): string {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default ObserveClient;
