import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  profilePic: string;

  @Column({ default: 'active' })
  status: string;

  // @Column({ nullable: true })
  // emailVerificationToken: string;

  // @Column({ default: false })
  // isEmailVerified: boolean;
}
