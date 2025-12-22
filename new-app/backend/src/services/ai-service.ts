// AI service for natural language processing using OpenAI

import OpenAI from 'openai';
import {
  ObsDataset,
  ObsDashboard,
  ObsMonitor,
  ObsWorksheet,
  ObsMetric,
  ObsRelationship,
  AIMessage,
  AIResponse,
} from '../types';

export class AIService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });
    this.model = 'gpt-4-turbo-preview';
  }

  async chat(
    messages: AIMessage[],
    context: {
      datasets?: ObsDataset[];
      dashboards?: ObsDashboard[];
      monitors?: ObsMonitor[];
      worksheets?: ObsWorksheet[];
      metrics?: ObsMetric[];
      relationships?: ObsRelationship[];
    }
  ): Promise<AIResponse> {
    try {
      // Build context summary for the AI
      const contextText = this.buildContext(context);

      // Prepare messages with system context
      const systemMessage: AIMessage = {
        role: 'system',
        content: `You are an expert assistant for Observe, a data analytics and observability platform. You help users understand their data environment, including datasets, dashboards, monitors, and worksheets.

${contextText}

Your role is to:
1. Answer questions about the user's Observe environment
2. Help users find specific datasets, dashboards, or monitors
3. Explain relationships between entities
4. Suggest best practices for data analysis
5. Provide insights about data lineage and dependencies

Be concise, helpful, and technically accurate. When referencing entities, use their names and IDs. If you're not sure about something, say so rather than making assumptions.`,
      };

      const allMessages = [systemMessage, ...messages];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: allMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseMessage = completion.choices[0].message.content || '';

      // Extract related entities from the response
      const relatedEntities = this.extractRelatedEntities(responseMessage, context);

      // Generate follow-up suggestions
      const suggestions = this.generateFollowUpSuggestions(messages, context);

      return {
        message: responseMessage,
        suggestions: suggestions.slice(0, 3),
        relatedEntities,
      };
    } catch (error: any) {
      console.error('AI service error:', error);
      throw new Error(`AI service failed: ${error.message}`);
    }
  }

  async generateSuggestions(context: {
    datasets?: ObsDataset[];
    dashboards?: ObsDashboard[];
    monitors?: ObsMonitor[];
    worksheets?: ObsWorksheet[];
  }): Promise<string[]> {
    const suggestions: string[] = [];

    // Generate contextual suggestions based on the environment
    if (context.datasets && context.datasets.length > 0) {
      suggestions.push('What datasets are available in my environment?');

      const recentDatasets = context.datasets
        .filter(d => d.updatedDate)
        .sort((a, b) => new Date(b.updatedDate!).getTime() - new Date(a.updatedDate!).getTime())
        .slice(0, 3);

      if (recentDatasets.length > 0) {
        suggestions.push('What datasets were recently updated?');
      }

      // Check for managed datasets
      const managedDatasets = context.datasets.filter(d => d.managedBy);
      if (managedDatasets.length > 0) {
        suggestions.push('Which datasets are managed by Observe?');
      }
    }

    if (context.dashboards && context.dashboards.length > 0) {
      suggestions.push('Show me all dashboards');
    }

    if (context.monitors && context.monitors.length > 0) {
      suggestions.push('What monitors are configured?');
    }

    if (context.datasets && context.datasets.length > 5) {
      suggestions.push('Help me find a specific dataset');
      suggestions.push('What are the most complex datasets?');
    }

    // Default suggestions if context is empty
    if (suggestions.length === 0) {
      suggestions.push(
        'What is in my Observe environment?',
        'How do I get started?',
        'What can you help me with?'
      );
    }

    return suggestions.slice(0, 5);
  }

  private buildContext(context: {
    datasets?: ObsDataset[];
    dashboards?: ObsDashboard[];
    monitors?: ObsMonitor[];
    worksheets?: ObsWorksheet[];
    metrics?: ObsMetric[];
    relationships?: ObsRelationship[];
  }): string {
    const parts: string[] = [];

    // Summary statistics
    const stats: string[] = [];
    if (context.datasets) stats.push(`${context.datasets.length} datasets`);
    if (context.dashboards) stats.push(`${context.dashboards.length} dashboards`);
    if (context.monitors) stats.push(`${context.monitors.length} monitors`);
    if (context.worksheets) stats.push(`${context.worksheets.length} worksheets`);
    if (context.metrics) stats.push(`${context.metrics.length} metrics`);

    parts.push(`Environment Summary: ${stats.join(', ')}`);

    // List key datasets
    if (context.datasets && context.datasets.length > 0) {
      const datasetList = context.datasets
        .slice(0, 20)
        .map(d => `- ${d.name} (${d.id}): ${d.description || 'No description'}`)
        .join('\n');
      parts.push(`\nKey Datasets:\n${datasetList}`);

      if (context.datasets.length > 20) {
        parts.push(`... and ${context.datasets.length - 20} more datasets`);
      }
    }

    // List dashboards
    if (context.dashboards && context.dashboards.length > 0) {
      const dashboardList = context.dashboards
        .slice(0, 10)
        .map(d => `- ${d.name} (${d.id}): ${d.description || 'No description'}`)
        .join('\n');
      parts.push(`\nDashboards:\n${dashboardList}`);

      if (context.dashboards.length > 10) {
        parts.push(`... and ${context.dashboards.length - 10} more dashboards`);
      }
    }

    // List monitors
    if (context.monitors && context.monitors.length > 0) {
      const monitorList = context.monitors
        .slice(0, 10)
        .map(m => `- ${m.name} (${m.id}): ${m.description || 'No description'}`)
        .join('\n');
      parts.push(`\nMonitors:\n${monitorList}`);

      if (context.monitors.length > 10) {
        parts.push(`... and ${context.monitors.length - 10} more monitors`);
      }
    }

    // Relationship summary
    if (context.relationships && context.relationships.length > 0) {
      parts.push(`\nTotal Relationships: ${context.relationships.length}`);
    }

    return parts.join('\n');
  }

  private extractRelatedEntities(
    responseMessage: string,
    context: {
      datasets?: ObsDataset[];
      dashboards?: ObsDashboard[];
      monitors?: ObsMonitor[];
      worksheets?: ObsWorksheet[];
      metrics?: ObsMetric[];
    }
  ): AIResponse['relatedEntities'] {
    const relatedEntities: NonNullable<AIResponse['relatedEntities']> = [];

    // Look for entity IDs in the response (format: id patterns)
    const allEntities = [
      ...(context.datasets || []).map(e => ({ ...e, type: 'dataset' })),
      ...(context.dashboards || []).map(e => ({ ...e, type: 'dashboard' })),
      ...(context.monitors || []).map(e => ({ ...e, type: 'monitor' })),
      ...(context.worksheets || []).map(e => ({ ...e, type: 'worksheet' })),
      ...(context.metrics || []).map(e => ({ ...e, type: 'metric' })),
    ];

    // Check if entity names or IDs are mentioned in the response
    allEntities.forEach(entity => {
      const nameMentioned = responseMessage.toLowerCase().includes(entity.name.toLowerCase());
      const idMentioned = responseMessage.includes(entity.id);

      if (nameMentioned || idMentioned) {
        relatedEntities.push({
          id: entity.id,
          type: entity.type,
          name: entity.name,
          relevance: 'Mentioned in response',
        });
      }
    });

    return relatedEntities.slice(0, 5);
  }

  private generateFollowUpSuggestions(
    messages: AIMessage[],
    context: {
      datasets?: ObsDataset[];
      dashboards?: ObsDashboard[];
      monitors?: ObsMonitor[];
      worksheets?: ObsWorksheet[];
    }
  ): string[] {
    const suggestions: string[] = [];
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();

    if (!lastUserMessage) {
      return [
        'What datasets do I have?',
        'Show me my dashboards',
        'What monitors are active?',
      ];
    }

    const question = lastUserMessage.content.toLowerCase();

    // Context-aware suggestions based on the question
    if (question.includes('dataset')) {
      suggestions.push(
        'Show me the relationships for this dataset',
        'What dashboards use this dataset?',
        'Who created this dataset?'
      );
    } else if (question.includes('dashboard')) {
      suggestions.push(
        'What datasets does this dashboard use?',
        'When was this dashboard last updated?',
        'Show me similar dashboards'
      );
    } else if (question.includes('monitor')) {
      suggestions.push(
        'What dataset does this monitor watch?',
        'Show me all monitors',
        'How often does this monitor run?'
      );
    } else if (question.includes('relationship') || question.includes('lineage')) {
      suggestions.push(
        'Show me upstream dependencies',
        'What depends on this dataset?',
        'Visualize the data lineage'
      );
    } else {
      suggestions.push(
        'Tell me more about my datasets',
        'What are the most important dashboards?',
        'Show me recent changes'
      );
    }

    return suggestions;
  }
}

export default AIService;
