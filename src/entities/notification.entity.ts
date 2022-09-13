import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public accountId: string;

  @Column()
  readonly recipient: string;

  @Column()
  readonly title?: string;

  @Column()
  readonly body?: string;

  @Column()
  readonly payload?: string;

  @Column()
  readonly usingAccessToken: boolean;

  @Column()
  readonly senderPublicKey: string;

  @CreateDateColumn({ name: 'created_at' })
  public timestamp: Date;
}

export default NotificationEntity;
