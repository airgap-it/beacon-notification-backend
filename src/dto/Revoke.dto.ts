import { Type } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeDTO {
  @IsNotEmpty()
  @IsString()
  readonly accountPublicKey: string;

  @IsNotEmpty()
  @IsString()
  readonly managementToken: string;

  @IsNotEmpty()
  @IsString()
  readonly protocolIdentifier: string;
}
