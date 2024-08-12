import {
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Body,
  Query,
  ConflictException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.username);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } else {
      return { message: 'User not found' };
    }
  }


  @Post('auth/register')
  @UseInterceptors(
    FileInterceptor('profilePic', {
      storage: diskStorage({
        destination: './uploads/profile-pics',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          console.log('File upload: Filename generation', `${uniqueSuffix}${ext}`); // Debugging statement
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          console.log('File upload: Invalid file type', file.originalname); // Debugging statement
          return callback(new Error('Only .jpg, .jpeg, .png files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async register(@UploadedFile() file: Express.Multer.File, @Body() userDto: any) {
    console.log('Registering user with data:', userDto); // Debugging statement
    console.log('Uploaded file:', file); // Debugging statement to log file metadata
    
    try {
      const user = await this.usersService.createUser(
        userDto.username,
        userDto.password,
        userDto.email,
        file ? file.filename : null,
        userDto.status || 'active',
      );
      console.log('User created:', user); // Debugging statement
      // await this.authService.sendVerificationEmail(user); // Uncomment if needed
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error during registration:', error); // Debugging statement
      if (error instanceof ConflictException) {
        return { message: error.message };
      }
      throw error;
    }
  }
  

  // @Get('verify-email')
  // async verifyEmail(@Query('token') token: string) {
  //   const user = await this.usersService.verifyEmail(token);
  //   if (user) {
  //     return { message: 'Email successfully verified' };
  //   } else {
  //     return { message: 'Invalid or expired token' };
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout() {
    await this.authService.logout();
    return { message: 'Logged out successfully' };
  }
}


