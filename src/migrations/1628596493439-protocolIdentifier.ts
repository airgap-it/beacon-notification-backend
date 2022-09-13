import {MigrationInterface, QueryRunner} from "typeorm";

export class protocolIdentifier1628596493439 implements MigrationInterface {
    name = 'protocolIdentifier1628596493439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "protocolIdentifier" character varying NOT NULL DEFAULT 'xtz'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "protocolIdentifier"`);
    }

}
