import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { apiLogger } from './observability';
import { HelloRequestDto, HelloResponseDto } from './app.dto';

const controllerLogger = apiLogger.child({
  controller: 'AppController',
});

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Return a simple string hello.' })
  getHello(): string {
    controllerLogger.info('Processing hello endpoint', {
      event: 'hello_endpoint_requested',
    });

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
