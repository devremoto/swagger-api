import { Controller, Get, Query } from '@nestjs/common';
import { Preview } from 'src/models/preview';
import { SwaggerService } from 'src/services/swagger/swagger.service';

@Controller('preview')
export class GeneratePreviewController {
  constructor(private readonly swaggerService: SwaggerService) {}

  @Get()
  async generatePreviewFromUrl(@Query('preview') preview: Preview) {
    try {
      return ''
    } catch (error) {
      console.log(error);
      return { error: 'Failed to fetch Swagger document' };
    }
  }
}
