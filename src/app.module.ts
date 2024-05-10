import { Module } from '@nestjs/common';
import { GeneratePreviewController } from './controllers/generate-preview/generate-preview.controller';
import { SaveReadmeController } from './controllers/save-readme/save-readme.controller';
import { DownloadReadmeController } from './controllers/download-readme/download-readme.controller';
import { SwaggerService } from './services/swagger/swagger.service';

@Module({
  imports: [],
  controllers: [
    GeneratePreviewController,
    SaveReadmeController,
    DownloadReadmeController,
  ],
  providers: [SwaggerService],
})
export class AppModule {}
