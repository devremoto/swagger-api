import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Endpoint } from 'src/models/endpoint';
import { Preview } from 'src/models/preview';
import { Schema } from 'src/models/schema';
import { Type } from 'src/models/type';
import { Response } from 'src/models/response';
import * as YAML from 'yamljs';
import { Api } from 'src/models/api';

@Injectable()
export class SwaggerService {
  api: Api;

  async fetchSwaggerDocument(preview: Preview): Promise<any> {
    try {
      if (!preview.content && preview.url) {
        const response = await axios.get(preview.url);
        preview.content = response.data;
      }

      return this.generateReadme(preview);
    } catch (error) {
      throw new Error('Error fetching Swagger document');
    }
  }

  private generateReadme(preview: Preview) {
    let sourceJson: any;
    let json: string;
    let source = preview.content;
    if (typeof preview.content === 'string') {
      try {
        sourceJson = JSON.parse(preview.content);
      } catch {
        sourceJson = YAML.parse(preview.content);
      }

      json = JSON.stringify(sourceJson);
      source = source.replace(/\n/g, '\n');
      json = json.replace(/\\"/g, '"').replace(/\\n/g, '\n');
    } else {
      sourceJson = source;
      source = json = JSON.stringify(sourceJson);
    }
    this.parseJson(sourceJson);
    const readme = `
# API Documentation
## ${sourceJson.info.title}
${sourceJson.info.description ? `${sourceJson.info.description}` : ''}
Version: ${sourceJson.info.version}
${this.tableContent(sourceJson, preview.baseUrl)}
${this.generateSchemasUi()}
`;

    return { source, sourceJson: json, readme };
  }
  parseJson(data: any) {
    const endpoints = this.generateEndpoints(data);
    const schemas = this.generateSchemas(data);
    const api = {
      endpoints,
      schemas,
    } as Api;
    this.api = api;
    return api;
  }

  private generateSchemas(data: any): Schema[] {
    if (!data?.components?.schemas && !data?.definitions) return [];

    const entries: any = data?.components?.schemas || data?.definitions;
    const schemas: Schema[] = [];
    for (const [name, schemaDetails] of Object.entries(entries)) {
      const schema: Schema = {
        name,
        description: (<any>schemaDetails).description,
        properties: [],
      };
      console.log((<any>schemaDetails))
      const properties = (<any>schemaDetails).properties || { array: (<any>schemaDetails).items } || { enum: <any>schemaDetails };
      if (properties) {
        for (const [name, propertyDetails] of Object.entries(properties)) {
          const prop: Type = {
            name,
            ...this.formatType(propertyDetails),
          };
          schema.properties.push(prop);
        }
      }
      schemas.push(schema);
    }
    return schemas;
  }

  private generateSchemasUi() {
    if (!this.api.schemas.length) {
      return '';
    }
    let readmeContent = '\n## Schemas\n\n';

    this.api.schemas.forEach((schema) => {
      readmeContent += `### ${schema.name}\n\n`;
      readmeContent += schema.description ? `${schema.description}\n\n` : '';
      readmeContent +=
        '| Property | Type | Description |\n| -------- | ---- | ----------- |\n';
      schema.properties.forEach((x) => {
        readmeContent += `| ${x.name} | ${x.refLink || x.ref || ''} | ${(x.description || '')?.replace(/\n/g, '<br />')} |\n`;
      });
    });
    return readmeContent;
  }

  getEnv(baseUrl: string) {
    if (baseUrl.toLowerCase().indexOf('dev') >= 0) {
      return '<b>DEV:</b> ';
    }
    if (baseUrl.toLowerCase().indexOf('prod') >= 0) {
      return '<b>>PROD:</b> ';
    }
    if (baseUrl.toLowerCase().indexOf('uat') >= 0) {
      return '<b>UAT:</b> ';
    }
    if (baseUrl.toLowerCase().indexOf('live') >= 0) {
      return '<b>LIVE:</b> ';
    }
    return '';
  }

  getPath(path: string, details: any, replaceParam: boolean = false) {
    const parameters = [...(details?.parameters || [])];
    const queryParameters = parameters.filter((x) => x.in === `query`);
    let query = '';
    let replacedPath = path;
    parameters.forEach((x) => {
      const value = replaceParam
        ? this.getParameterValue(x)
        : `{${x.name}:${x.schema?.type}}`;
      replacedPath = replacedPath.replace(`{${x.name}}`, value || x.name);
    });

    if (queryParameters.length) {
      query = queryParameters
        .map((x) => {
          const value = replaceParam
            ? this.getParameterValue(x)
            : `{${x.name}:${x.schema?.type || x.type}}`;
          return `${x.name}=${value}` || '';
        })
        .join('&');
      return `${replacedPath}?${query}`;
    }

    return `${replacedPath}`;
  }

  private getParameterValue(x: any) {
    const schema = x.schema || x;
    let value: any = schema?.type;
    switch (schema?.type?.toLowerCase()) {
      case 'boolean':
        value = true;
        break;
      case 'number':
      case 'integer':
      case 'int':
      case 'int32':
        value = 1;
        break;
      case 'string':
        console.log('schema', schema)
        value = `{${schema.name || schema.type || ''}}`;
        break;
    }

    if (schema?.name?.toLowerCase().indexOf('year') >= 0) {
      value = new Date().getFullYear();
    }
    if (schema?.name?.toLowerCase().indexOf('month') >= 0) {
      value = new Date().getMonth() + 1;
    }
    return value;
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

  private tableContent(data: any, baseUrl: string) {
    try {
      let readmeContent = baseUrl
        ? `\n\n## Base URL\n\n - ${this.getEnv(baseUrl)} [${baseUrl}](${baseUrl})\n\n`
        : '';
      readmeContent += `## Endpoints\n\n| Path | Method | Parameters ${baseUrl ? ' | Example ' : ''} | Responses |\n| ---- | ------  ${baseUrl ? ' | ---------- ' : ''} | ---------- | --------- |\n`;
      readmeContent += this.api.endpoints.map(endpoint => {
        let parameters = endpoint.parameters
          .map((parameter: any) => `${parameter.in}: ${parameter.name} (${parameter.required ? 'required' : 'optional'})`)
          .join('<br />')

        let responses = endpoint.responses
          .map((response: any) => `${response.statusCode}: ${response.description}`)
          .join('<br /><br />')
        return `| ${endpoint.path}${endpoint.description} | ${endpoint.method} | ${parameters} ${baseUrl ? ` | ${baseUrl}${endpoint.pathReplaced} ` : ''} | ${responses} |`
      }).join('\n')

      return readmeContent;
    } catch (error) {
      console.error(error);
    }
  }

  private formatType(details: any) {
    if (!details) {
      return;
    }
    console.log(details)
    if (details?.$ref) {
      const ref = details.$ref.split('/').pop();
      details.refLink = `[${ref}](#${ref.toLowerCase()})`;
      details.ref = details.ref ? details.ref : ref
      return details;
    }

    if (details?.type === 'array') {
      if (details?.items?.$ref) {
        const ref = details?.items?.$ref.split('/').pop();
        details.refLink = `[${ref}](#${ref.toLowerCase()})`;
        details.ref = details.ref ? details.ref : ref;
        return details;
      }
      details.ref = details.ref ? details.ref : this.simpleType(details.items)
      return details;
    }
    details.ref = details?.ref ? details.ref : this.simpleType(details)
    return details;
  }

  private simpleType(details: any) {
    let propertyType = details.type || '';
    if (details.enum) {
      propertyType += `[${details.enum}]`;
      propertyType += details.nullable ? ', nullable' : '';
    } else {
      if (details.format !== (details.type || ''))
        propertyType += details.format ? ` (${details.format})` : '';
      propertyType += details.nullable ? ', nullable' : '';
    }
    return propertyType;
  }

  private typeDescrption(details: any) {
    const responseDescription = details.description;
    const content = details.content
      ? details?.content['application/json']
      : details;

    if (content?.schema?.$ref) {
      const ref = this.parseReference(content?.schema?.$ref);
      return ` Schema: [${ref}](#${ref.toLowerCase()})\n${responseDescription}`;
    }

    if (content?.schema?.items?.$ref) {
      const ref = this.parseReference(content?.schema?.items?.$ref);
      return ` Schema: [${ref}[]](#${ref.toLowerCase()})\n${responseDescription}`;
    }
    return responseDescription;
  }

  private parseReference($ref: any) {
    const ref = $ref.split('/').pop();
    return ref;
  }
}
