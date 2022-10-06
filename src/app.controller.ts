import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { NotificationDTO } from './dto/Notification.dto';
import { RegisterDTO } from './dto/Register.dto';
import Challenge from './entities/challenge.entity';
import { AccountService } from './services/account.service';
import { ChallengeService } from './services/challenge.service';
import { KeypairService } from './services/keypair.service';
import { CURRENCY_HELPERS, getCurrencyHelper, toHex } from './utils/crypto';
import { InjectRepository } from '@nestjs/typeorm';
import Account from './entities/account.entity';
import { Repository } from 'typeorm';
import { RetrieveAccountsDTO } from './dto/RetrieveAccounts.dto';
import { RevokeDTO } from './dto/Revoke.dto';

export interface StatusResponse {
  success: boolean;
  message: string;
}

export interface PublicKeyResponse {
  publicKey: string;
}

export interface ChallengeResponse {
  id: string;
  timestamp: string;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const VALID_TIME_WINDOW = 5 * MINUTE;

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly keypairService: KeypairService,
    private readonly challengeService: ChallengeService,
    private readonly accountService: AccountService,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    return 'Beacon Notification Oracle';
  }

  /**
   * Returns status
   */
  @Get('/health')
  async health(): Promise<any> {
    return { status: 'ok' };
  }

  /**
   * Returns the PublicKey of the Push Oracle
   */
  @Get('/publicKey')
  async getPublicKey(): Promise<PublicKeyResponse> {
    const publicKey = await this.keypairService.getPublicKey();

    return { publicKey };
  }

  /**
   * Returns a challenge
   */
  @Get('/challenge')
  async getChallenge(): Promise<ChallengeResponse> {
    const c = new Challenge(); // Create empty challenge because everything is filled by the DB
    const response = await this.challengeService.create(c);

    return {
      id: response.id,
      timestamp: response.timestamp.toISOString(),
    };
  }

  /**
   * Sends a notification to an address
   */
  @Post('/send')
  async sendPushToPeer(
    @Body() peerNotification: NotificationDTO,
  ): Promise<StatusResponse> {
    // FIXME: add signature check (useless??)

    const accounts = await this.accountsRepository.find({
      where: { accessToken: peerNotification.accessToken },
    });
    if (accounts.length == 0 || accounts.length > 1) {
      throw new HttpException('Invalid AccessToken', HttpStatus.BAD_REQUEST);
    }

    const currencyHelper = getCurrencyHelper(
      peerNotification.protocolIdentifier,
    );

    if (!currencyHelper.isAddress(peerNotification.recipient)) {
      throw new HttpException(
        `recipient must be a valid ${peerNotification.protocolIdentifier} address`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const timestamp = new Date(peerNotification.timestamp).getTime();
    if (Math.abs(timestamp - new Date().getTime()) > VALID_TIME_WINDOW) {
      throw new HttpException(
        `Timestamp is outside the valid window of ${VALID_TIME_WINDOW}ms time window.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.accountService.sendNotification(accounts[0], peerNotification);

    return {
      success: true,
      message: 'Notification received!',
    };
  }

  /**
   * Allow an account to register
   */
  @Post('/register')
  async register(
    @Body() register: RegisterDTO,
  ): Promise<
    StatusResponse & { accessToken: string; managementToken: string }
  > {
    const data = await this.accountService.register(register);

    return {
      success: true,
      message: 'Account registered!',
      accessToken: data.accessToken,
      managementToken: data.managementToken,
    };
  }

  /**
   * Revoke an account with the management key
   */
  @HttpCode(200)
  @Post('/revoke')
  async revoke(@Body() revoke: RevokeDTO): Promise<StatusResponse> {
    const accounts = await this.accountsRepository.find({
      managementToken: revoke.managementToken,
      protocolIdentifier: revoke.protocolIdentifier,
      accountPublicKey: revoke.accountPublicKey,
    });

    if (accounts.length != 1) {
      throw new HttpException('no account found', HttpStatus.BAD_REQUEST);
    }

    await this.accountsRepository.delete({ id: accounts[0].id });
    return {
      success: true,
      message: 'access revoked!',
    };
  }

  @Post('/retrieve-accounts')
  @HttpCode(200)
  async retrieveAccounts(
    @Body() retrieveAccounts: RetrieveAccountsDTO,
  ): Promise<Account[]> {
    if (retrieveAccounts.deviceId === undefined) {
      throw new HttpException('deviceId is missing', HttpStatus.BAD_REQUEST);
    }

    // signed with token / challenge
    if (retrieveAccounts.challenge !== undefined) {
      if (!(await this.challengeService.validate(retrieveAccounts.challenge))) {
        throw new HttpException('Invalid challenge.', HttpStatus.BAD_REQUEST);
      }

      const constructedString = [
        'Tezos Signed Message: ',
        retrieveAccounts.accountPublicKey,
        retrieveAccounts.protocolIdentifier,
        retrieveAccounts.deviceId,
        retrieveAccounts.challenge.id,
        retrieveAccounts.challenge.timestamp,
      ].join(' ');

      const bytes = toHex(constructedString);
      const payloadBytes =
        '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;

      const helper = CURRENCY_HELPERS.get(retrieveAccounts.protocolIdentifier);
      const cryptoClient = helper.client;
      const { publicKey: plainPublicKey } = await helper.toPlainPubkey(
        retrieveAccounts.accountPublicKey,
      );
      let isValid = false;

      try {
        isValid = await cryptoClient.verifyMessage(
          payloadBytes,
          retrieveAccounts.signature,
          plainPublicKey,
        );
      } catch (error) {}
      if (!isValid) {
        throw new HttpException('Invalid signature.', HttpStatus.BAD_REQUEST);
      }
      await this.challengeService.remove(retrieveAccounts.challenge);
    } else {
      let account = undefined;
      try {
        account = await this.accountService.getByManagementToken(
          retrieveAccounts.managementToken,
        );
      } catch (error) {}

      if (
        account === undefined ||
        account === null ||
        account.accountPublicKey !== retrieveAccounts.accountPublicKey
      ) {
        throw new HttpException(
          'Invalid token or public key',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const currencyHelper = getCurrencyHelper(
      retrieveAccounts.protocolIdentifier,
    );
    const address = (
      await currencyHelper.protocol.getAddressFromPublicKey(
        retrieveAccounts.accountPublicKey,
      )
    ).getValue();
    // return same address and deviceId
    return this.accountService.getAllByDeviceIdAndAddress(
      retrieveAccounts.deviceId,
      address,
    );
  }
}
