import { Test, TestingModule } from '@nestjs/testing';
import { SaveReadmeController } from './save-readme.controller';

describe('SaveReadmeController', () => {
  let controller: SaveReadmeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaveReadmeController],
    }).compile();

    controller = module.get<SaveReadmeController>(SaveReadmeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
