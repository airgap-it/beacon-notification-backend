import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDTO } from 'src/dto/Register.dto';
import Account from '../entities/account.entity';
import { generateGUID } from '../utils/generate-uuid';
import { Repository } from 'typeorm';
import { ChallengeService } from './challenge.service';
import axios from 'axios';
import { NotificationDTO } from 'src/dto/Notification.dto';
import { getCurrencyHelper } from '../utils/crypto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private challengeService: ChallengeService,
  ) {}

  async create(account: Account) {
    try {
      const createdAccount = this.accountRepository.create(account);
      const savedAccount = await this.accountRepository.save(createdAccount);
      return savedAccount;
    } catch (e) {
      const savedAccount = await this.accountRepository.findOne({
        accountPublicKey: account.accountPublicKey,
        backendUrl: account.backendUrl,
      });
      return savedAccount;
    }
  }

  async getById(id: number) {
    const account = await this.accountRepository.findOne(id);
    if (account) {
      return account;
    }
    throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
  }

  async register(register: RegisterDTO): Promise<Account> {
    const helper = getCurrencyHelper(register.protocolIdentifier);

    const isValidChallenge = await this.challengeService.validate(
      register.challenge,
    );

    if (!isValidChallenge) {
      console.log('invalid challenge');
      throw new HttpException('Challenge invalid', HttpStatus.NOT_FOUND);
    }
    let address: string;

    try {
      address = (
        await helper.protocol.getAddressFromPublicKey(register.accountPublicKey)
      ).getValue();
    } catch (e) {
      throw new HttpException(
        `Address is not a valid ${register.protocolIdentifier} address`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await helper.checkSignature(register);

    const newAccount = new Account();
    newAccount.name = register.name;
    newAccount.challenge = register.challenge.id;
    newAccount.address = address;
    newAccount.accountPublicKey = register.accountPublicKey;
    newAccount.backendUrl = register.backendUrl;
    newAccount.signature = register.signature;
    newAccount.accessToken = await generateGUID(); // UUID
    newAccount.managementToken = await generateGUID(); // UUID
    newAccount.protocolIdentifier = register.protocolIdentifier;
    newAccount.deviceId = register.deviceId;

    const account = await this.create(newAccount);

    await this.challengeService.remove(register.challenge);

    return account;
  }

  async getAllByDeviceIdAndAddress(
    deviceId: string,
    address: string,
  ): Promise<Account[]> {
    return this.accountRepository.find({
      deviceId: deviceId,
      address: address,
    });
  }

  async getByManagementToken(managementToken: string): Promise<Account> {
    return this.accountRepository.findOne({
      managementToken: managementToken,
    });
  }

  async sendNotification(
    account: Account,
    notification: NotificationDTO,
  ): Promise<boolean> {
    console.log('SENDING NOTIFICATION', notification);

    let headers = {};

    if (account.backendUrl == process.env.TX_BACKEND_URL || 'NO_URL_SET') {
      headers = {
        authorization: process.env.TX_BACKEND_TOKEN || 'NO_TOKEN_PROVIDED',
      };
    }

    const obj: {
      receivers: string[];
      message: {
        title: string;
        body: string;
      };
      protocolIdentifier: string;
      data: any;
      deviceIds?: string[];
    } = {
      receivers: [account.address],
      message: {
        title: notification.title,
        body: `${notification.sender.name}: ${notification.body}`,
      },
      protocolIdentifier: account.protocolIdentifier,
      data: notification.payload,
    };

    if (notification.devices) {
      obj.deviceIds = notification.devices;
    }

    return axios.post(account.backendUrl, obj, {
      headers: headers,
    });
  }
}
