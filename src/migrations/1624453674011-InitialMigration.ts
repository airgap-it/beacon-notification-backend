import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1624453674011 implements MigrationInterface {
    name = 'InitialMigration1624453674011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "challenge" character varying NOT NULL, "address" character varying NOT NULL, "accountPublicKey" character varying NOT NULL, "backendUrl" character varying NOT NULL, "signature" character varying NOT NULL, "accessToken" character varying NOT NULL, "managementToken" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_00f68a29f4383ddb928f8f36d66" UNIQUE ("accessToken"), CONSTRAINT "UQ_dfc943a13fbba84503660730bb6" UNIQUE ("managementToken"), CONSTRAINT "pubkey-backend" UNIQUE ("accountPublicKey", "backendUrl"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "challenge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f31455ad09ea6a836a06871b7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" character varying NOT NULL, "recipient" character varying NOT NULL, "title" character varying NOT NULL, "body" character varying NOT NULL, "payload" character varying NOT NULL, "usingAccessToken" boolean NOT NULL, "senderPublicKey" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_112676de71a3a708b914daed289" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "whitelist_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "publicKey" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "isActive" boolean NOT NULL, CONSTRAINT "PK_5aa44df46d1c53a7602dee3c5cb" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "whitelist_entity"`);
        await queryRunner.query(`DROP TABLE "notification_entity"`);
        await queryRunner.query(`DROP TABLE "challenge"`);
        await queryRunner.query(`DROP TABLE "account"`);
    }

}
