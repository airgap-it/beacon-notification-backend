import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, Repository } from 'typeorm';
import Account from '../src/entities/account.entity';
import { generateGUID } from '../src/utils/generate-uuid';
import { ChallengeService } from '../src/services/challenge.service';
import Challenge from '../src/entities/challenge.entity';

describe('revoke (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let accountRepository: Repository<Account>;
  let challengeRepository: Repository<Challenge>;
  let accountCount: number;
  let account: Account;
  let challengeService: ChallengeService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
    challengeRepository = moduleFixture.get('ChallengeRepository');
    accountRepository = moduleFixture.get('AccountRepository');

    // setup account
    challengeService = new ChallengeService(challengeRepository);
    const challenge = await challengeService.create(new Challenge());
    const newAccount = new Account();
    newAccount.challenge = challenge.id;
    newAccount.name = 'testAccount';
    newAccount.signature = 'test';
    newAccount.address = 'testaddress';
    newAccount.accountPublicKey = 'publicKey';
    newAccount.backendUrl = 'http://test-backend';
    newAccount.accessToken = await generateGUID();
    newAccount.managementToken = await generateGUID();
    newAccount.protocolIdentifier = 'xtz';
    newAccount.deviceId = 'device1';
    account = await accountRepository.create(newAccount);
    await accountRepository.save(account);

    accountCount = await accountRepository.count();
  });

  afterAll(async () => {
    await app.close();
  });

  it('revoke invalid', async () => {
    await request(app.getHttpServer())
      .post('/revoke')
      .send({
        managementToken: account.managementToken,
        protocolIdentifier: 'xtz',
      })
      .expect(400);
    expect(await accountRepository.count()).toBe(accountCount);

    await request(app.getHttpServer())
      .post('/revoke')
      .send({
        accountPublicKey: 'publicKey',
        protocolIdentifier: 'xtz',
      })
      .expect(400);
    expect(await accountRepository.count()).toBe(accountCount);

    await request(app.getHttpServer())
      .post('/revoke')
      .send({
        accountPublicKey: 'publicKey',
        managementToken: account.managementToken,
      })
      .expect(400);
    expect(await accountRepository.count()).toBe(accountCount);

    await request(app.getHttpServer())
      .post('/revoke')
      .send({
        accountPublicKey: 'publicKey',
        managementToken: account.managementToken,
        protocolIdentifier: 'btc',
      })
      .expect(400);
    expect(await accountRepository.count()).toBe(accountCount);
  });

  it('revoke valid managementToken', async () => {
    await request(app.getHttpServer())
      .post('/revoke')
      .send({
        accountPublicKey: account.accountPublicKey,
        managementToken: account.managementToken,
        protocolIdentifier: account.protocolIdentifier,
      })
      .expect(200);
    expect(await accountRepository.count()).toBe(accountCount - 1);
  });
});
