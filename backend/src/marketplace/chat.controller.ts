import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('items/:itemId/chat-room')
  async getOrCreateRoom(@Param('itemId') itemId: string, @CurrentUser() user: User) {
    return this.chatService.getOrCreateRoom(itemId, user.id);
  }

  @Get('chat-rooms')
  async getMyRooms(@CurrentUser() user: User) {
    return this.chatService.getMyRooms(user.id);
  }

  @Get('chat-rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string, @CurrentUser() user: User) {
    return this.chatService.getRoom(roomId, user.id);
  }

  @Get('chat-rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getMessages(roomId, user.id, p, l);
  }

  @Post('chat-rooms/:roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, user.id, dto);
  }
}
