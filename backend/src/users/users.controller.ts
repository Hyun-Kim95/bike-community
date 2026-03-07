import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const full = await this.usersService.findById(user.id);
    const profile = full.profile!;
    return {
      id: full.id,
      email: full.email,
      nickname: full.nickname,
      status: full.status,
      lastLoginAt: full.lastLoginAt,
      profile: {
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        interestCategories: profile.interestCategories ?? [],
        region: profile.region,
        gradeName: profile.gradeName,
        totalPoints: profile.totalPoints,
      },
    };
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const full = await this.usersService.findById(user.id);
    const profile = full.profile!;

    if (dto.nickname !== undefined) full.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.interestCategories !== undefined) profile.interestCategories = dto.interestCategories;
    if (dto.region !== undefined) profile.region = dto.region;

    await this.usersService.saveUser(full);
    await this.usersService.saveProfile(profile);

    return {
      id: full.id,
      email: full.email,
      nickname: full.nickname,
      status: full.status,
      lastLoginAt: full.lastLoginAt,
      profile: {
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        interestCategories: profile.interestCategories ?? [],
        region: profile.region,
        gradeName: profile.gradeName,
        totalPoints: profile.totalPoints,
      },
    };
  }
}
