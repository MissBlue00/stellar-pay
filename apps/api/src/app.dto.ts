import { ApiProperty } from '@nestjs/swagger';

export class HelloRequestDto {
  @ApiProperty({
    description: 'The name of the user to say hello to',
    example: 'John Doe',
    required: false,
  })
  name?: string;
}

export class HelloResponseDto {
  @ApiProperty({
    description: 'The greeting message',
    example: 'Hello John Doe!',
  })
  message: string;
}
