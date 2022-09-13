import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique('pubkey-backend', ['accountPublicKey', 'backendUrl'])
@Unique(['accessToken'])
@Unique(['managementToken'])
class Account {
  @PrimaryGeneratedColumn('uuid')
  public id: number;

  @Column()
  public name: string;

  @Column()
  public challenge: string;

  @Column()
  public address: string;

  @Column()
  public accountPublicKey: string;

  @Column()
  public backendUrl: string;

  @Column()
  public signature: string;

  @Column()
  @Generated('uuid')
  public accessToken: string;

  @Column()
  @Generated('uuid')
  public managementToken: string;

  @Column()
  public deviceId: string; //deviceId returned from the transaction-backend

  @CreateDateColumn({ name: 'created_at' })
  public timestamp: Date;

  @Column({ default: 'xtz' })
  public protocolIdentifier: string;
}

export default Account;
