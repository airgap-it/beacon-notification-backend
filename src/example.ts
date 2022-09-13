import axios from 'axios';
import { TezosCryptoClient } from '@airgap/coinlib-core';
import * as bs58check from 'bs58check';
import { getKeypairFromSeed } from './utils/crypto';

const getChallenge = () => {
  return axios.get('http://localhost:3000/challenge');
};

const registerAccount = (challenge: any) => {
  return axios.post('http://localhost:3000/register', {
    name: 'asdf',
    challenge: challenge,
    accountPublicKey: 'edpkv5CzRErCjdYju2ePEr95DN9dbwNzoFntv9HfnpGHxgrP1B4os5',
    signature: 'edsig',
    backendUrl: 'https://mybackend.com' + Math.random().toString(),
  });
};

const sendPush = async (accessToken: any) => {
  const cryptoClient = new TezosCryptoClient();

  const recipient = 'tz1gTEivUUbG8849KxFTWmfdnPurcMcFGSPV';
  const title = 'Title';
  const body = 'Body2';
  const timestamp = new Date().toISOString();
  const payload = 'asdf';

  const keyPair = await getKeypairFromSeed('test');

  const constructedString = [recipient, title, body, timestamp, payload].join(
    ':',
  );

  const signature = await cryptoClient.signMessage(constructedString, {
    privateKey: Buffer.from(keyPair.privateKey),
  });

  const prefix = Buffer.from(new Uint8Array([13, 15, 37, 217]));

  const pubkey = bs58check.encode(
    Buffer.concat([prefix, Buffer.from(keyPair.publicKey)]),
  );

  console.log('sending');
  return axios
    .post('http://localhost:3000/send', {
      title: title,
      body: body,
      payload: payload,
      recipient: recipient,
      timestamp: timestamp,
      accessToken: accessToken,
      sender: {
        name: '1',
        publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
        signature,
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(error.response.data.message);
    });
};

// (async () => {
//     const challenge1 = await getChallenge()
//     console.log(challenge1.data)
//     // const challenge2 = await getChallenge()
//     // console.log(challenge2.data)

//     const reg1 = await registerAccount(challenge1.data)
//     console.log(reg1)
//     // const reg2 = await registerAccount(challenge2.data)
//     // console.log(reg2)

//     await new Promise(resolve => setTimeout(resolve, 1000))

//     const send1 = await sendPushToPeer(reg1.data.accessToken)
// })()
setTimeout(() => {
  sendPush('6708ff42-ad9c-0c73-f550-f593686df59f').then((send1: any) =>
    console.log(send1),
  );
}, 1000);
