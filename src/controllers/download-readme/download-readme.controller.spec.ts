import { Test, TestingModule } from '@nestjs/testing';
import { DownloadReadmeController } from './download-readme.controller';

describe('DownloadReadmeController', () => {
  let controller: DownloadReadmeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadReadmeController],
    }).compile();

    controller = module.get<DownloadReadmeController>(DownloadReadmeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
