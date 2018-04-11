import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, RelationId } from 'typeorm';
import { BaseEntity } from 'typeorm/repository/BaseEntity';
import { Exclude } from 'class-transformer';
import { MinLength, IsString, IsEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import {Order} from './order'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn() id?: number;

  @Column('text', { nullable: false })
  companyName: string;

  @IsString()
  @MinLength(2)
  @Column('text')
  firstName: string;

  @IsString()
  @MinLength(2)
  @Column('text')
  lastName: string;

  @IsEmail()
  @Column('text')
  email: string;

  @IsString()
  @MinLength(8)
  @Column('text')
  @Exclude({ toPlainOnly: true })
  password: string;

  @IsString()
  @Column('text', {default: 'External User'})
  role: string

  @IsString()
  @Column('text', { nullable: false })
  telefoonNummer: string;

  @ManyToOne(_ => Order, order => order.user)
  order: Order

  @RelationId((user: User)=> user.order)
  deliveryId: number

  async setPassword(rawPassword: string) {
    const hash = await bcrypt.hash(rawPassword, 10);
    this.password = hash;
  }

  checkPassword(rawPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, this.password);
  }
}