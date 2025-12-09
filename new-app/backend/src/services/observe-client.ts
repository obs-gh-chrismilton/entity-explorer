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

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/v1/`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async authenticate(username?: string, password?: string): Promise<ObsUser> {
    try {
      // If username/password provided, get a token first
      if (username && password) {
        const loginResponse = await axios.post(
          `${this.baseUrl}/v1/login`,
          { username, password },
          { timeout: 10000 }
        );
        this.token = loginResponse.data.accessToken;
        this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${this.token}`;
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
        user {
          id
          email
          label
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    const user = response.data.user;

    // Extract customer ID from user ID (format: customerId/userId)
    if (user.id && user.id.includes('/')) {
      this.customerId = user.id.split('/')[0];
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
      query GetAllDatasets {
        datasets {
          id
          name
          label
          description
          iconUrl
          folderId
          managedBy
          stages {
            id
            index
            input
            pipeline
            outputColumns {
              name
              type
              description
              isEnum
              isMetric
              isRepeated
            }
            params {
              name
              type
              defaultValue
              description
            }
          }
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    return response.data.datasets || [];
  }

  async getAllDashboards(): Promise<ObsDashboard[]> {
    const query = `
      query GetAllDashboards {
        dashboards {
          id
          name
          label
          description
          iconUrl
          folderId
          layout
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    return response.data.dashboards || [];
  }

  async getAllMonitors(): Promise<ObsMonitor[]> {
    // Get both v1 and v2 monitors
    const queryV1 = `
      query GetMonitorsV1 {
        monitors {
          id
          name
          label
          description
          iconUrl
          folderId
          stage {
            id
            index
            input
            pipeline
            outputColumns {
              name
              type
              description
            }
            params {
              name
              type
              defaultValue
              description
            }
          }
          lookbackTime
          dataStabilizationDelay
          inputQuery
          managedBy
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    const queryV2 = `
      query GetMonitorsV2 {
        monitorV2s {
          id
          name
          label
          description
          iconUrl
          folderId
          stage {
            id
            index
            input
            pipeline
            outputColumns {
              name
              type
              description
            }
            params {
              name
              type
              defaultValue
              description
            }
          }
          lookbackTime
          dataStabilizationDelay
          inputQuery
          managedBy
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    try {
      const [responseV1, responseV2] = await Promise.allSettled([
        this.graphqlQuery(queryV1),
        this.graphqlQuery(queryV2),
      ]);

      const monitors: ObsMonitor[] = [];

      if (responseV1.status === 'fulfilled') {
        monitors.push(...(responseV1.value.data.monitors || []));
      }

      if (responseV2.status === 'fulfilled') {
        monitors.push(...(responseV2.value.data.monitorV2s || []));
      }

      return monitors;
    } catch (error) {
      console.error('Error fetching monitors:', error);
      return [];
    }
  }

  async getAllWorksheets(): Promise<ObsWorksheet[]> {
    const query = `
      query GetAllWorksheets {
        worksheets {
          id
          name
          label
          description
          iconUrl
          folderId
          stages {
            id
            index
            input
            pipeline
            outputColumns {
              name
              type
              description
            }
            params {
              name
              type
              defaultValue
              description
            }
          }
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    const response = await this.graphqlQuery(query);
    return response.data.worksheets || [];
  }

  async getAllMetrics(): Promise<ObsMetric[]> {
    const query = `
      query GetAllMetrics {
        metrics {
          id
          name
          label
          description
          iconUrl
          createdBy {
            id
            email
            label
          }
          createdDate
          updatedBy {
            id
            email
            label
          }
          updatedDate
        }
      }
    `;

    try {
      const response = await this.graphqlQuery(query);
      return response.data.metrics || [];
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }
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
      const response = await this.axiosInstance.post('meta', {
        query,
        variables,
      });

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
