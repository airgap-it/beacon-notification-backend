import { Injectable } from '@nestjs/common';
import { KeyPair } from 'libsodium-wrappers';
import { getKeypairFromSeed } from '../utils/crypto';
import * as bs58check from 'bs58check';

@Injectable()
export class KeypairService {
  private keyPair: Promise<KeyPair>;

  constructor() {
    this.keyPair = getKeypairFromSeed(process.env.SEED || 'test');
  }

  async getPublicKey(): Promise<string> {
    const rawPublicKey = (await this.keyPair).publicKey;

    const prefix = Buffer.from(new Uint8Array([13, 15, 37, 217]));

    return bs58check.encode(Buffer.concat([prefix, Buffer.from(rawPublicKey)]));
  }
}
