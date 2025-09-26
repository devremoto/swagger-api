import { Endpoint } from './endpoint';
import { Schema } from './schema';

export class Api {
  name: string;
  version: string;
  endpoints: Endpoint[];
  schemas: Schema[];
  securitySchemes: any;
}
