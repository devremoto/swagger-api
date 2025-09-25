import { Body, Controller, Post } from '@nestjs/common';
import { Preview } from 'src/models/preview';
import { SwaggerService } from 'src/services/swagger/swagger.service';

@Controller('preview')
export class GeneratePreviewController {
  constructor(private readonly swaggerService: SwaggerService) { }

  @Post()
  async generatePreviewFromUrl(@Body() preview: Preview) {
    try {
      return this.swaggerService.fetchSwaggerDocument(preview);
    } catch (error) {
      return { error: 'Failed to fetch Swagger document' };
    }
  }
}
