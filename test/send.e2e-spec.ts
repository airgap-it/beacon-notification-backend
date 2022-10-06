import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, Repository } from 'typeorm';
import Challenge from 'src/entities/challenge.entity';
import { getKeypairFromSeed, toHex } from '../src/utils/crypto';
import { TezosAddress, TezosCryptoClient } from '@airgap/coinlib-core';
import { KeyPair } from 'libsodium-wrappers';
import { generateGUID } from '../src/utils/generate-uuid';
import Account from '../src/entities/account.entity';
import { VALID_TIME_WINDOW } from '../src/app.controller';

describe('send (e2e) Tezos', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let challengeRepository: Repository<Challenge>;
  let accRepository: Repository<Account>;
  const testSeed = 'test_seed_1';
  let keyPairAddress: KeyPair;
  let keyPairDapp: KeyPair;
  let registerResponse: any;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
    challengeRepository = moduleFixture.get('ChallengeRepository');
    accRepository = moduleFixture.get('AccountRepository');
    keyPairAddress = await getKeypairFromSeed(testSeed + '11');
    keyPairDapp = await getKeypairFromSeed(testSeed + '22');
    // do register
    registerResponse = await (async function () {
      // get access token
      const response = await request(app.getHttpServer())
        .get('/challenge')
        .expect('Content-Type', /json/)
        .expect(200);

      const constructedString = [
        'Tezos Signed Message: ',
        response.body.id,
        response.body.timestamp,
        Buffer.from(keyPairAddress.publicKey).toString('hex'),
        'https://example.com',
      ].join(' ');

      const bytes = toHex(constructedString);
      const payloadBytes =
        '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

      const cryptoClient = new TezosCryptoClient();
      const signature = await cryptoClient.signMessage(payloadBytes, {
        privateKey: Buffer.from(keyPairAddress.privateKey),
      });
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          name: 'testname',
          challenge: {
            id: response.body.id,
            timestamp: response.body.timestamp,
          },
          accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString(
            'hex',
          ),
          signature: signature,
          backendUrl: 'https://example.com',
          protocolIdentifier: 'xtz',
          deviceId: 'device1',
        })
        .expect('Content-Type', /json/);

      expect(registerResponse.status).toBe(201);
      return registerResponse;
    })();
  });

  afterAll(async () => {
    await app.close();
  });

  // signature useless since publickey get's passed in and no validation for dapp key?
  it.skip('/send invalid signature (POST)', async () => {
    await request(app.getHttpServer())
      .post('/send')
      .send({
        recipient: 'tz1hrHoK11TBz3HwWD2YZyZVWUyAg44h3eqd',
        title: 'Test Message',
        body: 'Test Body',
        payload: 'test',
        public: false,
        // accessToken: 'test',
        accessToken: registerResponse.body.accessToken,
        timestamp: new Date().toISOString(),
        sender: {
          name: 'testname',
          publicKey: 'tz1b3c7CKXtKSG6hJe8K5g2yLUAXFBu73DDh',
          signature: 'testsig22',
        },
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(500);
  });

  it('send invalid address', async () => {
    const notification = {
      recipient: '0xee4c55487dAA141545b9E22F455E13634796B5aF',
      title: 'Test Message',
      body: 'Test Body',
      timestamp: new Date().toISOString(),
      payload: 'test',
    };

    const bytes = toHex(
      [
        'Tezos Signed Message: ',
        notification.recipient,
        notification.title,
        notification.body,
        notification.timestamp,
        notification.payload,
      ].join(' '),
    );
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const signature2 = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairDapp.privateKey),
    });
    const resp = await request(app.getHttpServer())
      .post('/send')
      .send({
        recipient: notification.recipient,
        title: notification.title,
        body: notification.body,
        payload: notification.payload,
        timestamp: notification.timestamp,

        public: false,
        accessToken: registerResponse.body.accessToken,
        sender: {
          name: 'testname',
          publicKey: Buffer.from(keyPairDapp.publicKey).toString('hex'),
          signature: signature2,
        },
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(resp.text).toEqual(
      '{"statusCode":400,"message":"recipient must be a valid xtz address"}',
    );
  });
  it('send invalid access token', async () => {
    const address = await (
      await TezosAddress.fromPublicKey(
        Buffer.from(keyPairAddress.publicKey).toString('hex'),
      )
    ).getValue();

    const notification = {
      recipient: address,
      title: 'Test Message',
      body: 'Test Body',
      timestamp: new Date().toISOString(),
      payload: 'test',
    };

    const bytes = toHex(
      [
        'Tezos Signed Message: ',
        notification.recipient,
        notification.title,
        notification.body,
        notification.timestamp,
        notification.payload,
      ].join(' '),
    );
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const signature2 = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairDapp.privateKey),
    });

    const resp = await request(app.getHttpServer())
      .post('/send')
      .send({
        recipient: notification.recipient,
        title: notification.title,
        body: notification.body,
        payload: notification.payload,
        timestamp: notification.timestamp,

        public: false,
        accessToken: await generateGUID(),
        sender: {
          name: 'testname',
          publicKey: Buffer.from(keyPairDapp.publicKey).toString('hex'),
          signature: signature2,
        },
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(resp.text).toEqual(
      '{"statusCode":400,"message":"Invalid AccessToken"}',
    );
  });

  it('send wrong timestamp', async () => {
    const address = await (
      await TezosAddress.fromPublicKey(
        Buffer.from(keyPairAddress.publicKey).toString('hex'),
      )
    ).getValue();

    const notification = {
      recipient: address,
      title: 'Test Message',
      body: 'Test Body',
      timestamp: new Date(
        new Date().getTime() - 2 - VALID_TIME_WINDOW,
      ).toISOString(),
      payload: 'test',
    };

    const bytes = toHex(
      [
        'Tezos Signed Message: ',
        notification.recipient,
        notification.title,
        notification.body,
        notification.timestamp,
        notification.payload,
      ].join(' '),
    );
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const signature2 = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairDapp.privateKey),
    });

    const resp = await request(app.getHttpServer())
      .post('/send')
      .send({
        recipient: notification.recipient,
        title: notification.title,
        body: notification.body,
        payload: notification.payload,
        timestamp: notification.timestamp,

        public: false,
        accessToken: registerResponse.body.accessToken,
        sender: {
          name: 'testname',
          publicKey: Buffer.from(keyPairDapp.publicKey).toString('hex'),
          signature: signature2,
        },
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(resp.text).toEqual(
      `{"statusCode":400,"message":"Timestamp is outside the valid window of ${VALID_TIME_WINDOW}ms time window."}`,
    );
  });

  it('/send (POST)', async () => {
    const address = await (
      await TezosAddress.fromPublicKey(
        Buffer.from(keyPairAddress.publicKey).toString('hex'),
      )
    ).getValue();

    const notification = {
      recipient: address,
      title: 'Test Message',
      body: 'Test Body',
      timestamp: new Date().toISOString(),
      payload: 'test',
    };

    const bytes = toHex(
      [
        'Tezos Signed Message: ',
        notification.recipient,
        notification.title,
        notification.body,
        notification.timestamp,
        notification.payload,
      ].join(' '),
    );
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const signature2 = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairDapp.privateKey),
    });

    const resp = await request(app.getHttpServer())
      .post('/send')
      .send({
        recipient: notification.recipient,
        title: notification.title,
        body: notification.body,
        payload: notification.payload,
        timestamp: notification.timestamp,

        public: false,
        accessToken: registerResponse.body.accessToken,
        sender: {
          name: 'testname',
          publicKey: Buffer.from(keyPairDapp.publicKey).toString('hex'),
          signature: signature2,
        },
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(resp.body.success).toBeTruthy();
  });
});
