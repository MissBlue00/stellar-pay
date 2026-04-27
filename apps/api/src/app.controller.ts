import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HelloRequestDto, HelloResponseDto } from './app.dto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('hello')
  @ApiOperation({ summary: 'Say hello to a specific user' })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('ApiKey-auth')
  @ApiResponse({
    status: 201,
    description: 'The custom hello message.',
    type: HelloResponseDto,
  })
  sayHello(@Body() requestDto: HelloRequestDto): HelloResponseDto {
    const name = requestDto.name ?? 'World';
    return { message: `Hello ${name}!` };
  }
}
