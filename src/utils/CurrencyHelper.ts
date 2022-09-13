import { ICoinProtocol } from '@airgap/coinlib-core';
import { Ed25519CryptoClient } from '@airgap/coinlib-core/protocols/Ed25519CryptoClient';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationOptions } from 'class-validator';
import { RegisterDTO } from 'src/dto/Register.dto';

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
  checkSignature(register: RegisterDTO): void;
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
    const constructedString = [
      register.challenge.id,
      register.challenge.timestamp,
      result.publicKey,
      register.backendUrl,
    ].join(':');

    const { publicKey: plainPublicKey } = await this.toPlainPubkey(
      result.publicKey,
    );

    if (
      !(await this.client.verifyMessage(
        constructedString,
        register.signature,
        plainPublicKey,
      ))
    ) {
      throw new HttpException('Signature is not valid', HttpStatus.BAD_REQUEST);
    }
  }
}
