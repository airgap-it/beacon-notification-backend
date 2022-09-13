import {
  TezosCryptoClient,
  ICoinProtocol,
  TezosProtocol,
} from '@airgap/coinlib-core';
import { Ed25519CryptoClient } from '@airgap/coinlib-core/protocols/Ed25519CryptoClient';
import { BaseCurrencyHelper } from '../CurrencyHelper';
import * as sodium from 'libsodium-wrappers';
import * as bs58check from 'bs58check';

export class TezosCurrencyHelper extends BaseCurrencyHelper {
  client: Ed25519CryptoClient = new TezosCryptoClient();
  protocol: ICoinProtocol = new TezosProtocol();

  // isAddress(address: string): boolean {
  //   // const prefixes = ['tz1', 'tz2', 'tz3', 'KT1'];

  //   // if (!prefixes.some((p) => address.startsWith(p))) {
  //   //   return false;
  //   // }

  //   // const [error, decoded] = (() => {
  //   //   try {
  //   //     const decoded = bs58check.decode(address);
  //   //     return [undefined, decoded];
  //   //   } catch (error) {
  //   //     return [true, undefined];
  //   //   }
  //   // })();

  //   // if (error) {
  //   //   return false;
  //   // }

  //   // if (decoded.length !== 23) {
  //   //   return false;
  //   // }

  //   // return true;
  // }

  // TODO: what does it eactly do, how to convert to other currencies?
  // conversion for different pubkey formats
  async toPlainPubkey(
    publicKey: string,
  ): Promise<{ publicKey: string; prefix: Buffer }> {
    await sodium.ready;

    const prefixes = {
      // tz1...
      edpk: {
        length: 54,
        prefix: Buffer.from(new Uint8Array([6, 161, 159])),
      },
      // tz2...
      sppk: {
        length: 55,
        prefix: Buffer.from(new Uint8Array([6, 161, 161])),
      },
      // tz3...
      p2pk: {
        length: 55,
        prefix: Buffer.from(new Uint8Array([6, 161, 164])),
      },
    };

    let prefix: Buffer | undefined;
    let plainPublicKey: string | undefined;
    if (publicKey.length === 64) {
      prefix = prefixes.edpk.prefix;
      plainPublicKey = publicKey;
    } else {
      const entries = Object.entries(prefixes);
      for (let index = 0; index < entries.length; index++) {
        const [key, value] = entries[index];
        if (publicKey.startsWith(key) && publicKey.length === value.length) {
          prefix = value.prefix;
          const decoded = bs58check.decode(publicKey);
          plainPublicKey = decoded
            .slice(key.length, decoded.length)
            .toString('hex');
          break;
        }
      }
    }

    return {
      publicKey: plainPublicKey,
      prefix,
    };
  }
}
