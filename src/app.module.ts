import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeypairService } from './services/keypair.service';
import { ChallengeService } from './services/challenge.service';
import Account from './entities/account.entity';
import { AccountService } from './services/account.service';
import Challenge from './entities/challenge.entity';
// import { ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { ImprovedThrottlerGuard } from './utils/guard';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.NODE_ENV == 'test') {
          return {
            type: 'postgres',
            keepConnectionAlive: true,
            entities: ['src/entities/*.entity.ts'],
            host: process.env.POSTGRES_HOST || 'localhost',
            port: 5432,
            username: process.env.POSTGRES_USERNAME || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: process.env.POSTGRES_DBNAME || 'postgres',
            synchronize: true,
            migrationsTableName: 'custom_migration_table',
            migrations: ['src/migrations/*.ts'],
            cli: {
              migrationsDir: 'src/migrations',
            },
          };
        } else {
          console.log('process.env:', process.env);
          return {
            type: 'postgres',
            keepConnectionAlive: true,
            entities: ['dist/entities/**/*.entity.js'],
            migrations: ['dist/migrations/**/*.js'],
            host: process.env.POSTGRES_HOST || 'localhost',
            port: 5432,
            username: process.env.POSTGRES_USERNAME || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: process.env.POSTGRES_DBNAME || 'postgres',
            synchronize: false,
            migrationsTableName: 'custom_migration_table',
            cli: {
              migrationsDir: 'src/migrations',
            },
          };
        }
      },
    }),

    TypeOrmModule.forFeature([Account, Challenge]),
    // ThrottlerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     ttl: config.get('THROTTLE_TTL'),
    //     limit: config.get('THROTTLE_LIMIT'),
    //   }),
    // }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AccountService,
    KeypairService,
    ChallengeService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ImprovedThrottlerGuard,
    // },
  ],
})
export class AppModule {}
