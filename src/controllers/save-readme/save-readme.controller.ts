import { Controller, Post } from '@nestjs/common';

@Controller('readme')
export class SaveReadmeController {
  @Post()
  saveReadme() {
    // Save readme logic here
    return { message: 'Readme saved successfully' };
  }
}
