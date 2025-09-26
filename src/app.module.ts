import { Module } from '@nestjs/common';
import { GeneratePreviewController } from './controllers/generate-preview/generate-preview.controller';
import { SwaggerService } from './services/swagger/swagger.service';

@Module({
  imports: [],
  controllers: [
    GeneratePreviewController,
  ],
  providers: [SwaggerService],
})
export class AppModule { }
