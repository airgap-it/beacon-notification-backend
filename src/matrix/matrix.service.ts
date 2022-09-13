// import * as sodium from 'libsodium-wrappers'
// import BigNumber from 'bignumber.js'

// import { Injectable } from '@nestjs/common';
// import { MatrixClient } from 'src/matrix-client/MatrixClient';
// import { MatrixClientEventType } from 'src/matrix-client/models/MatrixClientEvent';
// import { Logger } from 'src/utils/Logger';

// import {
//     getHexHash,
//     toHex,
//     recipientString,
//     openCryptobox,
//     encryptCryptoboxPayload,
//     decryptCryptoboxPayload,
//     sealCryptobox,
//     getKeypairFromSeed
// } from '../utils/crypto'
// import { Storage } from 'src/storage/Storage';

// const logger = new Logger('MatrixService')

// @Injectable()
// export class MatrixService {
//     public readonly replicationCount: number = 1

//     private readonly clients: MatrixClient[] = []
//     private readonly storage: Storage = new Storage()

//     private readonly KNOWN_RELAY_SERVERS: string[] = [
//         'matrix.papers.tech'
//         // 'matrix.tez.ie',
//         // 'matrix-dev.papers.tech',
//         // "matrix.stove-labs.com",
//         // "yadayada.cryptonomic-infra.tech"
//     ]

//     private keyPair: sodium.KeyPair

//     constructor(
//     ) {
//         logger.log('constructor', 'MatrixService created')
//         getKeypairFromSeed('test').then(keyPair => {
//             this.keyPair = keyPair
//         })
//     }

//     public async start(): Promise<void> {
//         logger.log('start', 'starting client')
//         await sodium.ready

//         const loginRawDigest = sodium.crypto_generichash(
//             32,
//             sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
//         )
//         const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

//         logger.log('start', `connecting to ${this.replicationCount} servers`)

//         for (let i = 0; i < this.replicationCount; i++) {
//             // TODO: Parallel
//             const client = MatrixClient.create({
//                 baseUrl: `https://${await this.getRelayServer(
//                     await this.getPublicKeyHash(),
//                     i.toString()
//                 )}`,
//                 storage: this.storage
//             })

//             client.subscribe(MatrixClientEventType.INVITE, async (event) => {
//                 await client.joinRooms(event.content.roomId)
//             })

//             logger.log(
//                 'start',
//                 'login',
//                 await this.getPublicKeyHash(),
//                 'on',
//                 await this.getRelayServer(await this.getPublicKeyHash(), i.toString())
//             )

//             await client
//                 .start({
//                     id: await this.getPublicKeyHash(),
//                     password: `ed:${toHex(rawSignature)}:${await this.getPublicKey()}`,
//                     deviceId: toHex(this.keyPair.publicKey)
//                 })
//                 .catch((error) => logger.log(error))

//             await client.joinRooms(...client.invitedRooms).catch((error) => logger.log(error))

//             this.clients.push(client)
//         }
//     }

//     public async getRelayServer(publicKeyHash?: string, nonce: string = ''): Promise<string> {
//         const hash: string = publicKeyHash || (await getHexHash(this.keyPair.publicKey))

//         return this.KNOWN_RELAY_SERVERS.reduce(async (prevPromise: Promise<string>, curr: string) => {
//             const prev = await prevPromise
//             const prevRelayServerHash: string = await getHexHash(prev + nonce)
//             const currRelayServerHash: string = await getHexHash(curr + nonce)

//             const prevBigInt = await this.getAbsoluteBigIntDifference(hash, prevRelayServerHash)
//             const currBigInt = await this.getAbsoluteBigIntDifference(hash, currRelayServerHash)

//             return prevBigInt.isLessThan(currBigInt) ? prev : curr
//         }, Promise.resolve(this.KNOWN_RELAY_SERVERS[0]))
//     }

//     /**
//      * Get the public key
//      */
//     public async getPublicKey(): Promise<string> {
//         return toHex(this.keyPair.publicKey)
//     }

//     /**
//      * get the public key hash
//      */
//     public async getPublicKeyHash(): Promise<string> {
//         return getHexHash(this.keyPair.publicKey)
//     }

//     /**
//      * Create a cryptobox shared key
//      *
//      * @param otherPublicKey
//      * @param selfPrivateKey
//      */
//     protected async createCryptoBox(
//         otherPublicKey: string,
//         selfPrivateKey: Uint8Array
//     ): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
//         // TODO: Don't calculate it every time?
//         const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
//             Buffer.from(selfPrivateKey)
//         ) // Secret bytes to scalar bytes
//         const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
//             Buffer.from(selfPrivateKey).slice(32, 64)
//         ) // Secret bytes to scalar bytes
//         const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
//             Buffer.from(otherPublicKey, 'hex')
//         ) // Secret bytes to scalar bytes

//         return [
//             Buffer.from(kxSelfPublicKey),
//             Buffer.from(kxSelfPrivateKey),
//             Buffer.from(kxOtherPublicKey)
//         ]
//     }

//     /**
//      * Create a cryptobox server
//      *
//      * @param otherPublicKey
//      * @param selfPrivateKey
//      */
//     protected async createCryptoBoxServer(
//         otherPublicKey: string,
//         selfPrivateKey: Uint8Array
//     ): Promise<sodium.CryptoKX> {
//         const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

//         return sodium.crypto_kx_server_session_keys(...keys)
//     }

//     /**
//      * Create a cryptobox client
//      *
//      * @param otherPublicKey
//      * @param selfPrivateKey
//      */
//     protected async createCryptoBoxClient(
//         otherPublicKey: string,
//         selfPrivateKey: Uint8Array
//     ): Promise<sodium.CryptoKX> {
//         const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

//         return sodium.crypto_kx_client_session_keys(...keys)
//     }

//     /**
//      * Encrypt a message for a specific publicKey (receiver, asymmetric)
//      *
//      * @param recipientPublicKey
//      * @param message
//      */
//     protected async encryptMessageAsymmetric(
//         recipientPublicKey: string,
//         message: string
//     ): Promise<string> {
//         return sealCryptobox(message, Buffer.from(recipientPublicKey, 'hex'))
//     }

//     private async getAbsoluteBigIntDifference(
//         firstHash: string,
//         secondHash: string
//     ): Promise<BigNumber> {
//         const difference: BigNumber = new BigNumber(`0x${firstHash}`).minus(`0x${secondHash}`)

//         return difference.absoluteValue()
//     }
// }
