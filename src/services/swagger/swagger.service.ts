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
      console.log(error);
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
    console.log('aaaaaa');
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

      const properties = (<any>schemaDetails).properties || {
          enum: <any>schemaDetails,
        } || { array: (<any>schemaDetails).items };
      if (properties) {
        for (const [name, propertyDetails] of Object.entries(properties)) {
          const prop: Type = {
            name,
            ...this.getType(propertyDetails),
          };
          schema.properties.push(prop);
        }
      }
      schemas.push(schema);
    }
    console.log(schemas);
    return schemas;
  }

  private generateSchemasUi() {
    let readmeContent = '\n## Schemas\n\n';

    this.api.schemas.forEach((schema) => {
      readmeContent += `### ${schema.name}\n\n`;
      readmeContent += schema.description ? `${schema.description}\n\n` : '';
      readmeContent +=
        '| Property | Type | Description |\n| -------- | ---- | ----------- |\n';
      schema.properties.forEach((x) => {
        readmeContent += `| ${x.name} | ${x.type || x.refLink || ''} | ${x.description?.replace(/\n/g, '<br />')} |\n`;
      });
    });
    console.log(readmeContent);
    return readmeContent;
    // if (!data?.components?.schemas && !data?.definitions) return '';

    // let readmeContent = '\n## Schemas\n\n';
    // let entries: any = data?.components?.schemas || data?.definitions;

    // for (const [schemaName, schemaDetails] of Object.entries(entries)) {
    //     readmeContent += `### ${schemaName}\n\n`;

    //     let properties = (<any>schemaDetails).properties || { "enum": (<any>schemaDetails) } || { "array": (<any>schemaDetails).items };
    //     if (properties) {
    //         readmeContent += '| Property | Type | Description |\n| -------- | ---- | ----------- |\n';

    //         for (const [propertyName, propertyDetails] of Object.entries(properties)) {
    //             let description = (<any>schemaDetails).description || '';
    //             readmeContent += `| ${propertyName} | ${this.formatType(propertyDetails)} | ${description.replace(/\n/g, '<br />') || ''} |\n`;
    //         }
    //     } else {
    //         readmeContent += '-\n';
    //     }
    //     readmeContent += '\n';
    // }
    // return readmeContent;
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
      replacedPath = replacedPath.replace(`{${x.name}}`, value);
    });

    if (queryParameters.length) {
      query = queryParameters
        .map((x) => {
          const value = replaceParam
            ? this.getParameterValue(x)
            : `{${x.name}:${x.schema?.type}}`;
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
      case 'integer':
      case 'int':
      case 'int32':
        value = 1;
        break;
      case 'string':
        value = `{${schema.name}}`;
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
          endpoint.pathReplaced = this.getPath(path, details, true);
          endpoint.method = method.toUpperCase();
          const parameters = details.parameters || [];

          endpoint.parameters = parameters.map((x) => {
            return { ...x, ...this.getType(x) };
          });
          endpoint.responses = Object.entries(details.responses).map(
            ([statusCode, responseDetails]: any) => {
              const response: Response = {
                ...this.getType(responseDetails),
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

      for (const [path, methods] of Object.entries(data.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          readmeContent += `| ${this.getPath(path, details)} | ${method.toUpperCase()} | `;
          const parameters = details.parameters
            ? details.parameters
                .map(
                  (parameter: any) =>
                    `${parameter.in}: ${parameter.name} (${parameter.required ? 'required' : 'optional'})`,
                )
                .join('<br />')
            : '';
          readmeContent += `${parameters} | `;
          readmeContent += baseUrl
            ? `${baseUrl}${this.getPath(path, details, true)} | `
            : '';

          const responses = Object.entries(details.responses)
            .map(([statusCode, responseDetails]: any) => {
              const responseDescription = this.typeDescrption(responseDetails);
              return `${statusCode}: ${responseDescription}`;
            })
            .join(', <br/>');

          readmeContent += `${responses} |\n`;
        }
      }
      return readmeContent;
    } catch (error) {
      console.error(error);
    }
  }

  private formatType(details: any) {
    if (details.$ref) {
      const ref = details.$ref.split('/').pop();
      return `[${ref}](#${ref.toLowerCase()})`;
    }

    if (details?.type === 'array') {
      if (details?.items?.$ref) {
        const ref = details?.items?.$ref.split('/').pop();
        return `[${ref}[]](#${ref.toLowerCase()})`;
      }
      return this.simpleType(details.items);
    }

    return this.simpleType(details);
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
      return ` Schema: [${ref}](#${ref.toLowerCase()})`;
    }

    if (content?.schema?.items?.$ref) {
      const ref = this.parseReference(content?.schema?.items?.$ref);
      return ` Schema: [${ref}[]](#${ref.toLowerCase()})`;
    }
    return responseDescription;
  }

  private getType(details: any) {
    const content = details.content
      ? details?.content['application/json']
      : details;
    content.description = content.description || '';
    if (content?.schema?.$ref) {
      const ref = this.parseReference(content?.schema?.$ref);
      if (!content.type) {
        content.type = ref;
      }
      return { ...content, refLink: `[${ref}](#${ref.toLowerCase()})`, ref };
    }

    if (content?.schema?.items?.$ref) {
      const ref = this.parseReference(content?.schema?.items?.$ref);
      if (!content.type) {
        content.type = ref;
      }
      return { ...content, refLink: `[${ref}[]](#${ref.toLowerCase()})`, ref };
    }
    return content;
  }

  private parseReference($ref: any) {
    const ref = $ref.split('/').pop();
    return ref;
  }
}
