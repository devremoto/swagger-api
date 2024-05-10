import { Test, TestingModule } from '@nestjs/testing';
import { GeneratePreviewController } from './generate-preview.controller';

describe('GeneratePreviewController', () => {
  let controller: GeneratePreviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneratePreviewController],
    }).compile();

    controller = module.get<GeneratePreviewController>(
      GeneratePreviewController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
