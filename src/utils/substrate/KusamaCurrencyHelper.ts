import { KusamaProtocol, SubstrateCryptoClient } from '@airgap/coinlib-core';
import { BaseCurrencyHelper } from '../CurrencyHelper';

export class KusamaCurrencyHelper extends BaseCurrencyHelper {
  client = new SubstrateCryptoClient();
  protocol = new KusamaProtocol();

  async toPlainPubkey(
    publicKey: string,
  ): Promise<{ publicKey: string; prefix?: Buffer }> {
    return {
      publicKey: publicKey,
      prefix: undefined,
    };
  }

  isAddress(address: string): boolean {
    return RegExp(this.protocol.addressValidationPattern).test(address);
  }
}
