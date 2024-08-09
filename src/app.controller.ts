import { Controller, Get, Request, Post, UseGuards, Body, Query, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Get('/')
  gethello(@Request() req) {
    return "helloooooo"; 
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    console.log("user:",req.user);
    return req.user; 
  }
  
  @Post('auth/register')
  async register(@Body() userDto: any) {
    try {
      const user = await this.usersService.createUser(userDto.username, userDto.password, userDto.email);
      await this.authService.sendVerificationEmail(user);
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        return { message: error.message };
      }
      throw error;
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const user = await this.usersService.verifyEmail(token);
    if (user) {
      return { message: 'Email successfully verified' };
    } else {
      return { message: 'Invalid or expired token' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.authService.logout(token);
      return { message: 'Logged out successfully' };
    }
    return { message: 'Token missing' };
  }
}
