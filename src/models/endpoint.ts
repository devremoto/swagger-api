import { Response } from './response';

export class Endpoint {
  path: string;
  pathReplaced: string;
  method: string;
  parameters: any[];
  responses: Response[];
}
