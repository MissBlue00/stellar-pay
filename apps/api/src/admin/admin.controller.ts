import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminGuard } from './guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in as admin' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.email, dto.password);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('metrics')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('merchants')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all merchants' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email or name' })
  async listMerchants(@Query('search') search?: string) {
    return this.adminService.listMerchants(search);
  }
}
