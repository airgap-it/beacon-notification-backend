import { IsString, IsNotEmpty } from 'class-validator';

export class SenderDTO {
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly publicKey: string;

  @IsNotEmpty()
  @IsString()
  readonly signature: string;
}
