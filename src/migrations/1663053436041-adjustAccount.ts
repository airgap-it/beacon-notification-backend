import {MigrationInterface, QueryRunner} from "typeorm";

export class adjustAccount1663053436041 implements MigrationInterface {
    name = 'adjustAccount1663053436041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "UQ_1aae194bd20bfc9e9615504f05c"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "UQ_1aae194bd20bfc9e9615504f05c" UNIQUE ("address", "deviceId")`);
    }

}
