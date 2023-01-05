// import { Test, TestingModule } from '@nestjs/testing';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// // import Account from './entities/account.entity';
// // import Challenge from './entities/challenge.entity';
// // import { ConfigModule } from '@nestjs/config';
// import { AccountService } from './services/account.service';
// import { KeypairService } from './services/keypair.service';
// import { ChallengeService } from './services/challenge.service';
// import Account from './entities/account.entity';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import Challenge from './entities/challenge.entity';
// // import { Connection } from 'typeorm';

describe('AppController', () => {
  it('does not test anything', () => {
    console.log('nothing was tested');
  });
});
// describe('AppController', () => {
//   let appController: AppController;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AppController],
//       imports: [
//         TypeOrmModule.forRoot(),
//         TypeOrmModule.forFeature([Account, Challenge]),
//       ],

//       // providers: [AppService],
//       // imports: [
//       //   TypeOrmModule
//       //     .forRoot
//       //     //   {
//       //     //   type: 'postgres',
//       //     //   host: 'localhost',
//       //     //   port: 5432,
//       //     //   username: 'postgres',
//       //     //   password: 'postgres',
//       //     //   database: 'postgres',
//       //     // }
//       //     (),
//       //   TypeOrmModule.forFeature([Account, Challenge]),
//       //   ConfigModule.forRoot(),
//       // ],
//       // controllers: [AppController],
//       providers: [
//         AppService,
//         AccountService,
//         KeypairService,
//         ChallengeService,
//         // {
//         //   provide: getRepositoryToken(Account),
//         //   useValue: accountRepository,
//         // },
//       ],
//     }).compile();
//     // const app = module.createNestApplication();
//     // // app.useLogger(new TestLogger());
//     // await app.init();
//     // const connection = app.get(Connection);
//     // console.log('connection ', connection);
//     appController = module.get<AppController>(AppController);
//     console.log('appController ', appController);
//   });

//   it('should be defined', () => {
//     expect(appController).toBeDefined();
//   });

//   describe('root', () => {
//     it('should return "public key"', async () => {
//       expect(await appController.getPublicKey()).toBe('edasdf');
//     });

//     it('should return "Beacon Notification Backend"', async () => {
//       expect(await appController.getHello()).toBe('Beacon Notification Backend');
//     });

//     it('should return "Beacon Notification Backend"', async () => {
//       expect(await appController.getHello()).toBe('Beacon Notification Backend');
//     });
//   });

//   // afterEach(async () => {});
//   // afterEach(async () => {

//   // });
// });
