import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as YAML from 'yamljs';
import { Api } from 'src/models/api';
import { Endpoint } from 'src/models/endpoint';
import { Preview } from 'src/models/preview';
import { Schema } from 'src/models/schema';
import { Response } from 'src/models/response';

@Injectable()
export class SwaggerService {
  api: Api;

  async fetchSwaggerDocument(preview: Preview): Promise<any> {
    try {
      if (!preview.content && preview.url) {
        preview.content = (await axios.get(preview.url)).data;
      }
      return this.generateReadme(preview);
    } catch (error) {
      throw new Error('Error fetching Swagger document');
    }
  }

  private generateReadme(preview: Preview) {
    let sourceJson: any;
    let source = preview.content;
    if (preview.content && typeof preview.content === 'string') {
      try {
        sourceJson = JSON.parse(preview.content);
      } catch {
        sourceJson = YAML.parse(preview.content);
      }
    } else {
      sourceJson = source;
    }
    this.parseJson(sourceJson);
    const readme = `# API Documentation
## ${sourceJson.info.title}
${sourceJson.info.description ? `${sourceJson.info.description}` : ''}
Version: ${sourceJson.info.version}
${this.tableContent(preview.baseUrl)}
${this.generateSchemasUi()}
`;
    return { source: JSON.stringify(sourceJson), sourceJson: JSON.stringify(sourceJson), readme };
  }

  parseJson(data: any) {
    this.api = { endpoints: this.generateEndpoints(data), schemas: this.generateSchemas(data) } as Api;
    console.log(this.api);
    return this.api;
  }

  private generateSchemas(data: any): Schema[] {
    const entries = data?.components?.schemas || data?.definitions || {};
    return Object.entries(entries).map(([name, schemaDetails]: any) => {
      const properties = schemaDetails.properties || schemaDetails.items || schemaDetails.enum || {};
      return {
        name,
        description: schemaDetails.description,
        properties: Object.entries(properties).map(([name, propertyDetails]: any) => ({
          name,
          ...this.formatType(propertyDetails),
        })),
      } as Schema;
    });
  }

  private generateSchemasUi() {
    return this.api?.schemas.map(schema => {
      let properties = schema.properties.map(x => `| ${x.name} | ${x.refLink || x.ref || ''} | ${(x.description || '').replace(/\n/g, '<br />')} |`).join('\n');
      return `### ${schema.name}\n\n${schema.description ? `${schema.description}\n\n` : ''}| Property | Type | Description |\n| -------- | ---- | ----------- |\n${properties}`;
    }).join('\n');
  }

  private tableContent(baseUrl: string) {
    let readmeContent = '';
    try {
      readmeContent += baseUrl ? `\n\n## Base URL\n\n - ${this.getEnv(baseUrl)} [${baseUrl}](${baseUrl})\n\n` : '';
      readmeContent += `## Endpoints\n\n| Path | Method | Parameters ${baseUrl ? ' | Example ' : ''} | Responses |\n| ---- | ------  ${baseUrl ? ' | ---------- ' : ''} | ---------- | --------- |\n`;
      readmeContent += this.api.endpoints.map(endpoint => {
        const parameters = endpoint.parameters.map(parameter =>
          `${parameter.in}: ${parameter.name} (${parameter.required ? 'required' : 'optional'})`
        ).join('<br />');

        const exampleUrl = baseUrl ? ` | ${baseUrl}${endpoint.pathReplaced} ` : '';
        return `| ${endpoint.path}${endpoint.description} | ${endpoint.method} | ${parameters}${exampleUrl} | ${endpoint.responses.map(response => `${response.statusCode}: ${response.description}`).join('<br /><br />')} |`;
      }).join('\n');
    } catch (error) {
      console.error(error);
    }
    return readmeContent;
  }

  getEnv(baseUrl: string) {
    const envs = ['dev', 'prod', 'uat', 'live'];
    const found = envs.find(env => baseUrl.toLowerCase().includes(env));
    return found ? `<b>${found.toUpperCase()}:</b> ` : '';
  }

  getPath(path: string, details: any, replaceParam: boolean = false) {
    const parameters = (details?.parameters || []).filter(x => x.in === 'query');
    const replacedPath = parameters.reduce((acc, x) => acc.replace(`{${x.name}}`, replaceParam ? this.getParameterValue(x) : `{${x.name}:${x.schema?.type || x.type}}`), path);
    const query = parameters.map(x => `${x.name}=${replaceParam ? this.getParameterValue(x) : `{${x.name}:${x.schema?.type || x.type || ''}}`}`).join('&');
    return query ? `${replacedPath}?${query}` : replacedPath;
  }

  private getParameterValue(x: any) {
    switch (x.schema?.type?.toLowerCase()) {
      case 'boolean':
        return true;
      case 'number':
      case 'integer':
        return 1;
      case 'string':
        return `{${x.schema?.name || x.schema?.type || x.type || ''}}`;
      default: return '';
    }
  }

  private generateEndpoints(data: any): Endpoint[] {
    try {
      const endpoints: Endpoint[] = [];
      for (const [path, methods] of Object.entries(data.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          const endpoint: Endpoint = new Endpoint();
          endpoint.path = this.getPath(path, details);
          endpoint.description = details.description ? (`\n\n${details.description}`)?.replace(/\n/g, '<br />') : '',
            endpoint.pathReplaced = this.getPath(path, details, true);
          endpoint.method = method.toUpperCase();
          const parameters = details.parameters || [];

          endpoint.parameters = parameters.map((x) => {
            return { ...x, ...this.formatType(x) };
          });
          endpoint.responses = Object.entries(details.responses).map(
            ([statusCode, responseDetails]: any) => {
              const response: Response = {
                ...this.formatType(responseDetails),
                description: this.typeDescrption(responseDetails)?.replace(/\n/g, '<br />'),
                statusCode,
              };
              return response;
            },
          );

          endpoints.push(endpoint);
        }
      }
      return endpoints;
    } catch (error) {
      console.error(error);
    }
  }

  private formatType(details: any) {
    if (!details) {
      return;
    }

    console.log(details);

    if (details?.$ref) {
      const ref = details.$ref.split('/').pop();
      details.refLink = `[${ref}](#${ref.toLowerCase()})`;
      details.ref = details.ref ? details.ref : ref;
      return details;
    }

    if (details?.type === 'array') {
      if (details?.items?.$ref) {
        const ref = details?.items?.$ref.split('/').pop();
        details.refLink = `[${ref}](#${ref.toLowerCase()})`;
        details.ref = details.ref ? details.ref : ref;
        return details;
      }
      details.ref = details.ref ? details.ref : this.simpleType(details.items);
      return details;
    }

    details.ref = details?.ref ? details.ref : this.simpleType(details);
    return details;
  }

  private simpleType(details: any) {
    let propertyType = details.type || '';
    if (details.enum) {
      propertyType += `[${details.enum}]`;
      propertyType += details.nullable ? ', nullable' : '';
    } else {
      if (details.format !== (details.type || '')) {
        propertyType += details.format ? ` (${details.format})` : '';
      }
      propertyType += details.nullable ? ', nullable' : '';
    }
    return propertyType;
  }


  private typeDescrption(details: any) {
    const responseDescription = details.description;
    const content = details.content ? details.content['application/json'] : details;
    if (content?.schema?.$ref) {
      let ref = content.schema.$ref.split('/').pop();
      return ` Schema: [${ref}](#${ref.toLowerCase()})\n${responseDescription}`;
    }
    if (content?.schema?.items?.$ref) {
      let ref = content.schema.items.$ref.split('/').pop();
      return ` Schema: [${ref}[]](#${ref.toLowerCase()})\n${responseDescription}`;
    }
    return responseDescription;
  }
}