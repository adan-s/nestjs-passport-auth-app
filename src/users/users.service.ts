import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async createUser(username: string, password: string, email: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = this.usersRepository.create({ 
      username, 
      password: hashedPassword, 
      email, 
      emailVerificationToken 
    });
    return this.usersRepository.save(newUser);
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { emailVerificationToken: token } });
    if (user) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await this.usersRepository.save(user);
    }
    return user;
  }
}
