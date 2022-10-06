import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, Repository } from 'typeorm';
import Challenge from 'src/entities/challenge.entity';
import { getKeypairFromSeed, toHex } from '../src/utils/crypto';
import { TezosAddress, TezosCryptoClient } from '@airgap/coinlib-core';

describe('AppController (e2e) Tezos', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let challengeRepository: Repository<Challenge>;
  const testSeed = 'test_seed_1';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // await getConnection().synchronize(true);
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
    challengeRepository = moduleFixture.get('ChallengeRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .get('/challenge')
      .expect('Content-Type', /json/)
      .expect(200);

    const keyPair = await getKeypairFromSeed(testSeed);

    const constructedString = [
      'Tezos Signed Message: ',
      response.body.id,
      response.body.timestamp,
      Buffer.from(keyPair.publicKey).toString('hex'),
      'https://example.com',
    ].join(' ');

    const bytes = toHex(constructedString);
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const cryptoClient = new TezosCryptoClient();
    const signature = await cryptoClient.signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPair.privateKey),
    });

    const registerResponse = await request(app.getHttpServer())
      .post('/register')
      .send({
        name: 'testname',
        challenge: {
          id: response.body.id,
          timestamp: response.body.timestamp,
        },
        accountPublicKey: Buffer.from(keyPair.publicKey).toString('hex'),
        signature: signature,
        backendUrl: 'https://example.com',
        protocolIdentifier: 'xtz',
        deviceId: 'device1',
      })
      .expect('Content-Type', /json/)
      .expect(201);
    expect(registerResponse.body.success).toBeTruthy();
    expect(registerResponse.body.accessToken).toBeDefined();
    expect(registerResponse.body.managementToken).toBeDefined();
  });
});
