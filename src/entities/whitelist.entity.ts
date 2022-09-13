import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
class WhitelistEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public publicKey: string;

  @CreateDateColumn({ name: 'created_at' })
  public timestamp: Date;

  @Column()
  public isActive: boolean;
}

export default WhitelistEntity;
