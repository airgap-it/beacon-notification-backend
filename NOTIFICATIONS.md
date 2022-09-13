## Use Cases

1. Beacon (DApp <=> Wallet): When the connection between a dApp and a Wallet is established, the user can optionally allow the dApp to send notifications to the user.

Generic: User sends a message, get a notification to be notified about it (only the user himself can trigger this)

2. Random tz1 address: Users can send any tz1 address a notification.

eg. TzColors: You are no longer the highest bidder / Someone bid on your auction / You won an auction!
eg. Tezos Domains: Domain is about to expire / Someone wants to claim your domain

## Transports

The communication will happen over the matrix server.

- Push Notifications
- Email Notifications
- Telegram Notifications
- Discord Notifications

## Privacy

### Use Case 1

The wallet can share the pubkey of the backend, so it is possible for the dApp to send an encrypted message to that specific backend, which allows the notification to be sent in plain text.

### Use Case 2

When sending "anonymous" messages, privacy is trickier. We have a couple of options:

- Messages can be sent in plain text, with the recipient visible as well
- Messages can be encrypted with the public key of the recipient. This is only possible if the address is revealed. Only the Wallet will be able to decrypt the messages, so the notification can not contain human readable payload.
- Messages can be encrypted for the backend. This would allow the notification to contain human readable text, but it would require some kind of "mapping" between address => backend pubkey.

## Spam

### Use Case 1

Beacuse the dApp and Wallet have a connection open (as well as with the backend), spam prevention could be easily implemented by having a whitelist where access can be revoked.

### Use Case 2

It is difficult to prevent users from spamming a certain address because messages can be sent anonymously. We will have to add some kind of (configurable) parameters. Some ideas: (Note, all messages have to include a signature by the sender)

- Require sender to have a minimum amount of tez. (maybe for a certain time period?)
- Require sender to have an "access token", which could be in the form of an NFT

## Brainstorming

- Persist Notifications for x hours