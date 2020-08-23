// Copyright 2017-2020 @polkadot/app-toolbox authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeypairType } from '@polkadot/util-crypto/types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge, Dropdown, Input, InputAddress, Static } from '@polkadot/react-components';
import keyring from '@polkadot/ui-keyring';
import uiSettings from '@polkadot/ui-settings';
import { isHex, hexToU8a, u8aConcat } from '@polkadot/util';
import { naclVerify, schnorrkelVerify } from '@polkadot/util-crypto';

import { useTranslation } from './translate';
import BN from 'bn.js';
import { BN_ZERO } from '@polkadot/util';
import { registry } from '@polkadot/react-api';

type CryptoTypes = KeypairType | 'unknown';

interface Props {
  className?: string;
}

function TokenManagerVerify ({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [{ cryptoType, isValid }, setValidity] = useState<{ cryptoType: CryptoTypes; isValid: boolean }>({ cryptoType: 'unknown', isValid: false });
  const [{ isValidPk, publicKey }, setPublicKey] = useState<{ isValidPk: boolean; publicKey: Uint8Array | null }>({ isValidPk: false, publicKey: null });
  const [{ isValidSignature, signature }, setSignature] = useState<{ isValidSignature: boolean; signature: string }>({ isValidSignature: false, signature: '' });
  const [cryptoOptions] = useState([{ text: t<string>('Crypto not detected'), value: 'unknown' }].concat(uiSettings.availableCryptos as any[]));

  const [relayer, setRelayer] = useState<string | null>("");
  const [from, setFrom] = useState<string | null>("");
  const [to, setTo] = useState<string | null>("");
  const [token, setToken] = useState<string | null>("");
  const [amount, setAmount] = useState<BN>(BN_ZERO);
  const [nonce, setNonce] = useState(BN_ZERO);

  useEffect((): void => {
    let cryptoType: CryptoTypes = 'unknown';
    let isValid = isValidPk && isValidSignature;

    // We cannot just use the keyring verify since it may be an address. So here we first check
    // for ed25519, if not valid, we try against sr25519 - if neither are valid, well, we have
    // not been able to validate the signature
    if (isValid && publicKey) {
      let isValidSr = false;
      let isValidEd = false;

      let context = registry.createType('Text', "authorization for transfer operation");
      let relayerObj = registry.createType('AccountId', hexToU8a(relayer));
      let fromObj = registry.createType('AccountId', hexToU8a(from));
      let toObj = registry.createType('AccountId', hexToU8a(to));
      let tokenObj = registry.createType('H160', hexToU8a(token));
      let amountObj = registry.createType('u128', amount);
      let nonceObj = registry.createType('u64', nonce);

      let dataToEncode = u8aConcat(
        context.toU8a(false),
        relayerObj.toU8a(true),
        fromObj.toU8a(true),
        toObj.toU8a(true),
        tokenObj.toU8a(true),
        amountObj.toU8a(true),
        nonceObj.toU8a(true));

      try {
        isValidEd = naclVerify(dataToEncode, signature, publicKey);
      } catch (error) {
        // do nothing, already set to false
      }
      if (isValidEd) {
        cryptoType = 'ed25519';
      } else {
        try {
          isValidSr = schnorrkelVerify(dataToEncode, signature, publicKey);
        } catch (error) {
          // do nothing, already set to false
        }

        if (isValidSr) {
          cryptoType = 'sr25519';
        } else {
          isValid = false;
        }
      }
    }

    setValidity({ cryptoType, isValid });

  }, [isValidPk, isValidSignature, publicKey, signature, relayer, from, to, token, amount, nonce]);

  const _onChangeAddress = useCallback(
    (accountId: string | null): void => {
      let publicKey: Uint8Array | null = null;

      try {
        publicKey = keyring.decodeAddress(accountId || '');
      } catch (err) {
        console.error(err);
      }

      setPublicKey({ isValidPk: !!publicKey && publicKey.length === 32, publicKey });
    },
    []
  );

  const _onChangeSignature = useCallback(
    (signature: string) => setSignature({ isValidSignature: isHex(signature) && signature.length === 130, signature }),
    []
  );

  return (
    <div className={`toolbox--Verify ${className}`}>
      <div className='ui--row'>
        <InputAddress
          className='full'
          help={t<string>('The account that signed the input')}
          isError={!isValidPk}
          isInput
          label={t<string>('verify using address')}
          onChange={_onChangeAddress}
        />
      </div>

      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('Relayer account public key (32 bytes).')}
          label={t<string>('Relayer account public key.')}
          onChange={setRelayer}
          value={relayer}
        />
      </div>
      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('From account public key (32 bytes).')}
          label={t<string>('From account public key.')}
          onChange={setFrom}
          value={from}
        />
      </div>
      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('To account public key (32 bytes).')}
          label={t<string>('To account public key.')}
          onChange={setTo}
          value={to}
        />
      </div>
      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('Token Id (H160).')}
          label={t<string>('Token Id')}
          onChange={setToken}
          value={token}
        />
      </div>
      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('Amount (u128).')}
          label={t<string>('Amount')}
          onChange={setAmount}
          value={amount}
        />
      </div>
      <div className='ui--row'>
        <Input
          autoFocus
          className='full'
          help={t<string>('Nonce (u64).')}
          label={t<string>('Nonce')}
          onChange={setNonce}
          value={nonce}
        />
      </div>
      <div className='ui--row'>
        <div className='ui--AlignedIconContainer'>
          <Badge
            className='alignedBadge'
            color={isValid ? 'green' : (isValidSignature ? 'red' : 'gray')}
            icon={isValid ? 'check' : (isValidSignature ? 'exclamation' : 'question')}
          />
        </div>
        <Input
          className='full'
          help={t<string>('The signature as by the account being checked, supplied as a hex-formatted string.')}
          isError={!isValidSignature}
          label={t<string>('the supplied signature')}
          onChange={_onChangeSignature}
          value={signature}
        />
      </div>
      <div className='ui--row'>
        <Dropdown
          defaultValue={cryptoType}
          help={t<string>('Cryptography used to create this signature. It is auto-detected on valid signatures.')}
          isDisabled
          label={t<string>('signature crypto type')}
          options={cryptoOptions}
        />
      </div>
    </div>
  );
}

export default React.memo(styled(TokenManagerVerify)`
  .ui--AlignedIconContainer {
    position: absolute;
    z-index: 1;
  }

  .alignedBadge {
    left: 1.25rem;
    position: relative;
    top: 1.25rem;
  }
`);
