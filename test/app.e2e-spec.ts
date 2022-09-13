import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Connection } from 'typeorm';

describe('AppController (e2e) Tezos', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(Connection).synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/publicKey (GET)', () => {
    return request(app.getHttpServer())
      .get('/publicKey')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({
        publicKey: 'edpkv5CzRErCjdYju2ePEr95DN9dbwNzoFntv9HfnpGHxgrP1B4os5',
      });
  });

  it('hello', async () => {
    await request(app.getHttpServer()).get('/').expect(200);
  });

  it('/health', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});
