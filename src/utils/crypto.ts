import { HttpException, HttpStatus } from '@nestjs/common';
import * as sodium from 'libsodium-wrappers';
import { CurrencyHelper } from './CurrencyHelper';
import { KusamaCurrencyHelper } from './substrate/KusamaCurrencyHelper';
import { PolkadotCurrencyHelper } from './substrate/PolkadotCurrencyHelper';
import { TezosCurrencyHelper } from './tezos/TezosCurrencyHelper';

// class DummyCryptoClient implements Ed25519CryptoClient {
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   encryptAsymmetric(payload: string, publicKey: string): Promise<string> {
//     return new Promise(() => 'dummy');
//   }
//   decryptAsymmetric(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     encryptedPayload: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     keypair: { publicKey: string; privateKey: Buffer },
//   ): Promise<string> {
//     return new Promise(() => 'dummy');
//   }
//   signMessage(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     message: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     keypair: { publicKey?: string; privateKey: Buffer },
//   ): Promise<string> {
//     return new Promise(() => 'dummy');
//   }

//   verifyMessage(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     message: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     signature: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     publicKey: string,
//   ): Promise<boolean> {
//     return new Promise(() => true);
//   }
//   encryptAES(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     payload: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     privateKey: Buffer,
//   ): Promise<string> {
//     return new Promise(() => 'dummy');
//   }
//   decryptAES(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     encryptedPayload: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     privateKey: Buffer,
//   ): Promise<string> {
//     return new Promise(() => 'dummy');
//   }
//   recoverPublicKeyFromSignature(): Promise<void> {
//     return new Promise(() => 'dummy');
//   }
// }

// class DummyHelper implements CurrencyHelper {
//   // FIXME: what to implement as a client? which functions?
//   client: Ed25519CryptoClient = new DummyCryptoClient();
//   protocol = new TezosProtocol(); // FIXME: make dummy implementation?

//   validate() {
//     console.log('dummy validation');
//   }
//   toPlainPubkey(): Promise<{ publicKey: string; prefix: Buffer }> {
//     // FIXME: how to handle?
//     return new Promise(() => {
//       return {
//         public_key: 'dummy_pubkey',
//         prefix: Buffer.from(new Uint8Array([6, 161, 164])),
//       };
//     });
//   }
// }

export const CURRENCY_HELPERS = new Map<string, CurrencyHelper>([
  ['xtz', new TezosCurrencyHelper()],
  ['kusama', new KusamaCurrencyHelper()],
  ['polkadot', new PolkadotCurrencyHelper()],
  // TODO: add more helpers
]);

/**
 * Convert a value to hex
 *
 * @param value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toHex(value: any): string {
  return Buffer.from(value).toString('hex');
}

/**
 * Get the hex hash of a value
 *
 * @param key
 */
export async function getHexHash(
  key: string | Buffer | Uint8Array,
): Promise<string> {
  await sodium.ready;

  return toHex(sodium.crypto_generichash(32, key));
}

/**
 * Get a keypair from a seed
 *
 * @param seed
 */
export async function getKeypairFromSeed(
  seed: string,
): Promise<sodium.KeyPair> {
  await sodium.ready;

  return sodium.crypto_sign_seed_keypair(
    sodium.crypto_generichash(32, sodium.from_string(seed)),
  );
}

/**
 * Encrypt a message with a shared key
 *
 * @param message
 * @param sharedKey
 */
export async function encryptCryptoboxPayload(
  message: string,
  sharedKey: Uint8Array,
): Promise<string> {
  await sodium.ready;

  const nonce = Buffer.from(
    sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES),
  );
  const combinedPayload = Buffer.concat([
    nonce,
    Buffer.from(
      sodium.crypto_secretbox_easy(
        Buffer.from(message, 'utf8'),
        nonce,
        sharedKey,
      ),
    ),
  ]);

  return toHex(combinedPayload);
}

/**
 * Decrypt a message with a shared key
 *
 * @param payload
 * @param sharedKey
 */
export async function decryptCryptoboxPayload(
  payload: Uint8Array,
  sharedKey: Uint8Array,
): Promise<string> {
  await sodium.ready;

  const nonce = payload.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = payload.slice(sodium.crypto_secretbox_NONCEBYTES);

  return Buffer.from(
    sodium.crypto_secretbox_open_easy(ciphertext, nonce, sharedKey),
  ).toString('utf8');
}

/**
 * Encrypt a message with a public key
 *
 * @param payload
 * @param publicKey
 */
export async function sealCryptobox(
  payload: string | Buffer,
  publicKey: Uint8Array,
): Promise<string> {
  await sodium.ready;

  const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
    Buffer.from(publicKey),
  ); // Secret bytes to scalar bytes
  const encryptedMessage = sodium.crypto_box_seal(payload, kxSelfPublicKey);

  return toHex(encryptedMessage);
}

/**
 * Decrypt a message with public + private key
 *
 * @param encryptedPayload
 * @param publicKey
 * @param privateKey
 */
export async function openCryptobox(
  encryptedPayload: string | Buffer,
  publicKey: Uint8Array,
  privateKey: Uint8Array,
): Promise<string> {
  await sodium.ready;

  const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
    Buffer.from(privateKey),
  ); // Secret bytes to scalar bytes
  const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
    Buffer.from(publicKey),
  ); // Secret bytes to scalar bytes

  const decryptedMessage = sodium.crypto_box_seal_open(
    encryptedPayload,
    kxSelfPublicKey,
    kxSelfPrivateKey,
  );

  return Buffer.from(decryptedMessage).toString();
}

/**
 * Get the recipient string used in the matrix message
 *
 * @param recipientHash
 * @param relayServer
 */
export function recipientString(
  recipientHash: string,
  relayServer: string,
): string {
  return `@${recipientHash}:${relayServer}`;
}

export function getCurrencyHelper(protocolIdentifier: string): CurrencyHelper {
  if (!CURRENCY_HELPERS.has(protocolIdentifier)) {
    throw new HttpException(
      'protocolIdentifier `' + protocolIdentifier + '` not supported',
      HttpStatus.BAD_REQUEST,
    );
  }
  return CURRENCY_HELPERS.get(protocolIdentifier);
}
