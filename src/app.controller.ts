import { Controller, Get, Request, Post, UseGuards, Body, Query } from '@nestjs/common';
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

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('auth/register')
  async register(@Body() userDto: any) {
    // Create a new user in the database
    const user = await this.usersService.createUser(userDto.username, userDto.password, userDto.email);
    
    // Send a verification email to the user
    await this.authService.sendVerificationEmail(user);
    
    // Return the created user (excluding sensitive info like the password)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Email verification endpoint
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    // Verify the email using the token provided in the URL
    const user = await this.usersService.verifyEmail(token);
    
    // Return a success message if the token is valid
    if (user) {
      return { message: 'Email successfully verified' };
    } else {
      // Return an error message if the token is invalid or expired
      return { message: 'Invalid or expired token' };
    }
  }
}
