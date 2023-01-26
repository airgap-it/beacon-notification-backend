# Beacon Notification Backend

This project is a small webserver that enables notification support for Beacon DApps / Wallets.

The beacon-notification-backend backend gives DApps an endpoint to send notifications, as well as capabilities for wallets to register, manage and and revoke DApp access.

## Usage

### DApp Developers

DApp developers do not have to host the beacon-notification-backend. The wallet is in charge of hosting it and the URL will be shared with the dApp as part of the pairing process.

### Wallet Developers

Wallet developers can either host their instance of the beacon-notification-backend, or they can use the one hosted by the beacon team.

In any case, the wallet team needs to write and host a service that sends out the actual notifications to their users. Whenever the beacon-notification-backend receives a request from the dApp, it will send a POST request to that service, which is then responsible to send out the notification to the user.

Using this design, it is possible to re-use the beacon-notification-backend to send any kind of notifications. It can be used for push notifications, email notifications, discord messages, telegram messages, etc. It will be the wallets responsibility to obtain the information of the user, eg. email address or discord username. Many wallets already have such notification mechanisms in place (eg. Push Notifications), so all that needs to be done is adding a new endpoint to their backend that is compatible with the beacon-notification-backend POST request.

#### Push Notifications

## Installation

### Docker

The easiest way to run the project is to use `docker` and `docker-compose`. If you have docker installed, simply run the following command.

`docker-compose --project-name beacon-notification-backend -f ./.devcontainer/docker-compose.yml up`

Then install the dependencies.

`npm i`

Note: On some systems, the prebuilt binaries for "sqlite3" are not available. If they are not available and cannot be built locally, `npm i` fails with a "node-gyp" error. If this happens, remove "sqlite3" from the dependencies in the package.json. docker-compose will start a local database, so the sqlite3 package is not needed. 

### Without Docker

Make sure you have node and npm installed, then install the dependencies.

`npm i`

## Running the project

`npm start`

Now you can access the server under `http://localhost:3000/`

## Tests

You can run tests by running the command

`npm run test`

To run end to end tests, first, start the server with

`npm start`

then run the following command (without stopping the server, eg, in a new terminal window)

`npm run test:e2e`