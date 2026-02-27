import { Controller, Get, Patch, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete own account' })
  async deleteMe(@CurrentUser('id') userId: string) {
    return this.userService.delete(userId);
  }
}
