import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { Preview } from 'src/models/preview';
import { ReadmeResult } from 'src/models/readmeResult';
import { SwaggerService } from 'src/services/swagger/swagger.service';

@Controller('preview')
export class GeneratePreviewController {
  constructor(private readonly swaggerService: SwaggerService) { }

  @ApiCreatedResponse({ description: 'The preview has been generated.', type: ReadmeResult })
  @Post()
  async generatePreviewFromUrl(@Body() preview: Preview) {
    try {
      return this.swaggerService.fetchSwaggerDocument(preview);
    } catch (error) {
      return { error, message: 'Failed to fetch Swagger document' };
    }
  }
}
