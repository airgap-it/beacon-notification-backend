import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import { IsCryptoAddress } from '../validators/IsCryptoAddress';
import { SenderDTO } from './Sender.dto';

export class NotificationDTO {
  @IsCryptoAddress()
  readonly recipient: string;

  @IsString()
  readonly title?: string;

  @IsString()
  readonly body?: string;

  @IsString()
  readonly payload?: string;

  @IsString()
  readonly accessToken: string;

  @IsNotEmpty()
  @IsDateString()
  readonly timestamp: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SenderDTO)
  readonly sender: SenderDTO; // FIXME: is the sender really needed? (e.g. the signing part)

  @IsNotEmpty()
  @IsString()
  readonly protocolIdentifier: string;

  @IsArray()
  @IsOptional()
  readonly devices: string[];
}
