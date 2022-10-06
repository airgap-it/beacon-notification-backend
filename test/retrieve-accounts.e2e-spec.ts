import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, Repository } from 'typeorm';
import {
  getCurrencyHelper,
  getKeypairFromSeed,
  toHex,
} from '../src/utils/crypto';
import { TezosCryptoClient } from '@airgap/coinlib-core';
import { KeyPair } from 'libsodium-wrappers';
import Account from 'src/entities/account.entity';
import { generateGUID } from '../src/utils/generate-uuid';

describe('retrieve accounts (e2e)', () => {
  const testSeed = 'test_seed_1';
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let accountRepository: Repository<Account>;
  let keyPairAddress: KeyPair;
  let keyPairAddress2: KeyPair;
  let keyPairAddress3: KeyPair;
  let registerResponse1: any;
  let registerResponse1_1: any;
  let registerResponse2: any;
  let registerResponse3: any;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
    accountRepository = moduleFixture.get('AccountRepository');
    keyPairAddress = await getKeypairFromSeed(testSeed + '11');
    keyPairAddress2 = await getKeypairFromSeed(testSeed + '112');
    keyPairAddress3 = await getKeypairFromSeed(testSeed + '113');
    const register = async function (
      keyPairAddr: KeyPair,
      deviceId: string,
      backendUrl = 'https://example.com',
    ) {
      // get access token
      const response = await request(app.getHttpServer())
        .get('/challenge')
        .expect('Content-Type', /json/)
        .expect(200);

      const constructedString = [
        response.body.id,
        response.body.timestamp,
        Buffer.from(keyPairAddr.publicKey).toString('hex'),
        backendUrl,
      ].join(' ');

      const bytes = toHex(constructedString);
      const payloadBytes = '05' + '0100' + toHex(bytes.length) + bytes;

      const cryptoClient = new TezosCryptoClient();
      const signature = await cryptoClient.signMessage(payloadBytes, {
        privateKey: Buffer.from(keyPairAddr.privateKey),
      });
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          name: 'testname',
          challenge: {
            id: response.body.id,
            timestamp: response.body.timestamp,
          },
          accountPublicKey: Buffer.from(keyPairAddr.publicKey).toString('hex'),
          signature: signature,
          backendUrl: backendUrl,
          protocolIdentifier: 'xtz',
          deviceId: deviceId,
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(registerResponse.status).toBe(201);
      return registerResponse;
    };
    registerResponse1 = await register(keyPairAddress, 'testdevice1');
    registerResponse1_1 = await register(
      keyPairAddress,
      'testdevice1',
      'https://example2.com',
    );
    registerResponse2 = await register(keyPairAddress2, 'testdevice2');
    registerResponse3 = await register(keyPairAddress3, 'testdevice1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('retrieve invalid', async () => {
    let response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken + 'test',
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body.message).toEqual('Invalid token or public key');

    response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body.message).toEqual('Invalid token or public key');

    response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken,
        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body.message).toEqual('Invalid token or public key');

    response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken,
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body.message).toEqual('deviceId is missing');

    response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken,
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        deviceId: 'testdevice1',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    expect(response.body.message).toEqual(
      'protocolIdentifier `undefined` not supported',
    );
  });

  it('retrieve valid w challenge', async () => {
    const challenge_response = await request(app.getHttpServer())
      .get('/challenge')
      .expect('Content-Type', /json/)
      .expect(200);

    const retrieveAccounts = {
      accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
      protocolIdentifier: 'xtz',
      deviceId: 'testdevice1',
    };

    const bytes = toHex(
      [
        retrieveAccounts.accountPublicKey,
        retrieveAccounts.protocolIdentifier,
        retrieveAccounts.deviceId,
        challenge_response.body.id,
        challenge_response.body.timestamp,
      ].join(' '),
    );
    const payloadBytes = '05' + '0100' + toHex(bytes.length) + bytes;

    const signature = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairAddress.privateKey),
    });
    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        challenge: {
          id: challenge_response.body.id,
          timestamp: challenge_response.body.timestamp,
        },

        accountPublicKey: retrieveAccounts.accountPublicKey,

        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
        signature: signature,
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).toEqual(2);
    expect(response.body).toEqual(
      (
        await accountRepository.find({
          deviceId: 'testdevice1',
          address: (
            await getCurrencyHelper('xtz').protocol.getAddressFromPublicKey(
              Buffer.from(keyPairAddress.publicKey).toString('hex'),
            )
          ).getValue(),
        })
      ).map(
        (obj: any): Account => {
          obj.timestamp = obj.timestamp.toISOString();
          return obj as Account;
        },
      ),
    );
  });

  it('retrieve valid w invalid challenge', async () => {
    const challenge_response = await request(app.getHttpServer())
      .get('/challenge')
      .expect('Content-Type', /json/)
      .expect(200);

    const retrieveAccounts = {
      accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
      protocolIdentifier: 'xtz',
      deviceId: 'testdevice1',
    };

    const bytes = toHex(
      [
        retrieveAccounts.accountPublicKey,
        retrieveAccounts.protocolIdentifier,
        retrieveAccounts.deviceId,
        challenge_response.body.id,
        challenge_response.body.timestamp,
      ].join(' '),
    );
    const payloadBytes = '05' + '0100' + toHex(bytes.length) + bytes;

    const signature = await new TezosCryptoClient().signMessage(payloadBytes, {
      privateKey: Buffer.from(keyPairAddress.privateKey),
    });
    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        challenge: {
          id: await generateGUID(),
          timestamp: challenge_response.body.timestamp,
        },

        accountPublicKey: retrieveAccounts.accountPublicKey,

        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
        signature: signature,
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toEqual('Invalid challenge.');
  });

  it('retrieve w invalid signature', async () => {
    const challenge_response = await request(app.getHttpServer())
      .get('/challenge')
      .expect('Content-Type', /json/)
      .expect(200);

    const retrieveAccounts = {
      accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
      protocolIdentifier: 'xtz',
      deviceId: 'testdevice1',
    };

    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        challenge: {
          id: challenge_response.body.id,
          timestamp: challenge_response.body.timestamp,
        },

        accountPublicKey: retrieveAccounts.accountPublicKey,

        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
        signature: 'invalid',
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toEqual('Invalid signature.');
  });

  it('retrieve valid w managementToken, multiple', async () => {
    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken,
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        deviceId: 'testdevice1',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).toEqual(2);
    expect(response.body).toEqual(
      (
        await accountRepository.find({
          deviceId: 'testdevice1',
          address: (
            await getCurrencyHelper('xtz').protocol.getAddressFromPublicKey(
              Buffer.from(keyPairAddress.publicKey).toString('hex'),
            )
          ).getValue(),
        })
      ).map(
        (obj: any): Account => {
          obj.timestamp = obj.timestamp.toISOString();
          return obj as Account;
        },
      ),
    );
  });

  it('retrieve valid w managementToken, single', async () => {
    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse2.body.managementToken,
        accountPublicKey: Buffer.from(keyPairAddress2.publicKey).toString(
          'hex',
        ),
        deviceId: 'testdevice2',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).toEqual(1);
    expect(response.body).toEqual(
      (
        await accountRepository.find({
          deviceId: 'testdevice2',
          address: (
            await getCurrencyHelper('xtz').protocol.getAddressFromPublicKey(
              Buffer.from(keyPairAddress2.publicKey).toString('hex'),
            )
          ).getValue(),
        })
      ).map(
        (obj: any): Account => {
          obj.timestamp = obj.timestamp.toISOString();
          return obj as Account;
        },
      ),
    );
  });

  it('retrieve valid w managementToken, empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/retrieve-accounts')
      .send({
        managementToken: registerResponse1.body.managementToken,
        accountPublicKey: Buffer.from(keyPairAddress.publicKey).toString('hex'),
        deviceId: 'testdevice111',
        protocolIdentifier: 'xtz',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toEqual([]);
  });
});
