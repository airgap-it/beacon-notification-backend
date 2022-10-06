import { ICoinProtocol } from '@airgap/coinlib-core';
import { Ed25519CryptoClient } from '@airgap/coinlib-core/protocols/Ed25519CryptoClient';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationOptions } from 'class-validator';
import { RegisterDTO } from 'src/dto/Register.dto';
import * as bs58check from 'bs58check';
import { toHex } from './crypto';

export interface CurrencyHelper {
  client: Ed25519CryptoClient;
  protocol: ICoinProtocol;
  validate(property?: string, validationOptions?: ValidationOptions): void;
  toPlainPubkey(
    publicKey: string,
  ): Promise<{
    publicKey: string;
    prefix?: Buffer;
  }>;
  checkSignature(register: RegisterDTO): Promise<void>;
  isAddress(address: string): boolean;
}

export abstract class BaseCurrencyHelper implements CurrencyHelper {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAddress(address: string): boolean {
    return RegExp(this.protocol.addressValidationPattern).test(address);
  }
  client: Ed25519CryptoClient;
  protocol: ICoinProtocol;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(property?: string, validationOptions?: ValidationOptions): void {
    throw new Error('Method not implemented.');
  }
  toPlainPubkey(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    publicKey: string,
  ): Promise<{ publicKey: string; prefix?: Buffer }> {
    throw new Error('Method not implemented.');
  }

  public async checkSignature(register: RegisterDTO): Promise<void> {
    let result: any;
    try {
      result = await this.toPlainPubkey(register.accountPublicKey);
    } catch (e) {
      throw new HttpException(
        'Address is not a valid' + this.protocol.identifier + '  address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const concat = Buffer.concat([
      Buffer.from(new Uint8Array([13, 15, 37, 217])),
      Buffer.from(register.accountPublicKey, 'hex'),
    ]);

    const prefixed = bs58check.encode(concat);

    const constructedString = [
      'Tezos Signed Message: ',
      register.challenge.id,
      register.challenge.timestamp,
      prefixed,
      register.backendUrl,
    ].join(' ');

    const bytes = toHex(constructedString);
    const payloadBytes =
      '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

    const { publicKey: plainPublicKey } = await this.toPlainPubkey(
      result.publicKey,
    );

    if (
      !(await this.client.verifyMessage(
        payloadBytes,
        register.signature,
        plainPublicKey,
      ))
    ) {
      throw new HttpException('Signature is not valid', HttpStatus.BAD_REQUEST);
    }
  }
}
