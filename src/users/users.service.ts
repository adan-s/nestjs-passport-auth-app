import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
//import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'profilePic', 'status', 'password'],
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(
    username: string,
    password: string,
    email: string,
    profilePic: string,
    status: string,
  ): Promise<User> {
    const existingUserByUsername = await this.findOne(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingUserByEmail = await this.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    //const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = this.usersRepository.create({
      username,
      password: hashedPassword,
      email,
      profilePic: profilePic || '',
      status: status || 'active',
      //emailVerificationToken
    });
    return this.usersRepository.save(newUser);
  }

  async updateUserProfile(userId: number, updateData: any): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
  
    user.username = updateData.username || user.username;
    user.status = updateData.status || user.status;
    user.email = updateData.email || user.email;
  
    if (updateData.profilePic) {
      user.profilePic = updateData.profilePic;
    }
  
    console.log('Final user data to save:', user);
  
    return this.usersRepository.save(user);
  }
  

  async changeUserPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    return this.usersRepository.save(user);
  }

  // async verifyEmail(token: string): Promise<User | undefined> {
  //   const user = await this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  //   if (user) {
  //     user.isEmailVerified = true;
  //     user.emailVerificationToken = null;
  //     await this.usersRepository.save(user);
  //   }
  //   return user;
  // }
}
