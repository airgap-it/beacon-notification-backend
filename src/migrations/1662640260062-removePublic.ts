import { MigrationInterface, QueryRunner } from 'typeorm';

export class removePublic1662640260062 implements MigrationInterface {
  name = 'removePublic1662640260062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "deviceId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_00f68a29f4383ddb928f8f36d66"`,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "accessToken"`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "accessToken" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_00f68a29f4383ddb928f8f36d66" UNIQUE ("accessToken")`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_dfc943a13fbba84503660730bb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "managementToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "managementToken" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_dfc943a13fbba84503660730bb6" UNIQUE ("managementToken")`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_1aae194bd20bfc9e9615504f05c" UNIQUE ("deviceId", "address")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_1aae194bd20bfc9e9615504f05c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_dfc943a13fbba84503660730bb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "managementToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "managementToken" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_dfc943a13fbba84503660730bb6" UNIQUE ("managementToken")`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_00f68a29f4383ddb928f8f36d66"`,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "accessToken"`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "accessToken" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_00f68a29f4383ddb928f8f36d66" UNIQUE ("accessToken")`,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "deviceId"`);
  }
}
