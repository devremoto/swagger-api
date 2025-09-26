import { ApiProperty } from '@nestjs/swagger';

export class ReadmeResult {
    @ApiProperty()
    source: string;
    @ApiProperty()
    sourceJson: string;
    @ApiProperty()
    readme: string;
}
