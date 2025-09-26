import { ApiProperty } from '@nestjs/swagger';

export class Preview {
  @ApiProperty({ example: 'http://localhost:3000/swagger-json' })
  url: string;

  @ApiProperty({ example: '' })
  baseUrl: string;

  @ApiProperty({ example: '' })
  content: string;
}
