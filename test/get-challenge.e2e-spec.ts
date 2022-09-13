import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Connection, Repository } from 'typeorm';
import Challenge from 'src/entities/challenge.entity';
import { getKeypairFromSeed } from './../src/utils/crypto';
import { TezosAddress, TezosCryptoClient } from '@airgap/coinlib-core';

describe('get-challenge (e2e) Tezos', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let challengeRepository: Repository<Challenge>;
  const testSeed = 'test_seed_1';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
    challengeRepository = moduleFixture.get('ChallengeRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/challenge (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/challenge')
      .expect('Content-Type', /json/)
      .expect(200);
    const challenge = await challengeRepository.findOne();
    expect(response.body.id).toEqual(challenge.id);
    expect(response.body.timestamp).toEqual(challenge.timestamp.toISOString());
  });
});
