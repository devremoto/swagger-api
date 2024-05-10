import { Controller, Get } from '@nestjs/common';

@Controller('readme')
export class DownloadReadmeController {
  @Get()
  downloadReadme() {
    // Download readme logic here
    return { message: 'Readme downloaded successfully' };
  }
}
