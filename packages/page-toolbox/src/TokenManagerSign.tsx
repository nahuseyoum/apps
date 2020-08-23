// Copyright 2017-2020 @polkadot/app-toolbox authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { Button, Input, Output, InputAddress } from '@polkadot/react-components';
import { hexToU8a, u8aToHex, u8aConcat } from '@polkadot/util';

import { useTranslation } from './translate';
import { BN_ZERO } from '@polkadot/util';
import { registry } from '@polkadot/react-api';
import keyring from '@polkadot/ui-keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import BN from 'bn.js';
import styled from 'styled-components';

function TokenManagerSign (): React.ReactElement {
  const { t } = useTranslation();

  const [relayer, setRelayer] = useState<string | null>("");
  const [from, setFrom] = useState<string | null>("");
  const [to, setTo] = useState<string | null>("");
  const [token, setToken] = useState<string | null>("");

  const [amount, setAmount] = useState<BN>(BN_ZERO);
  const [nonce, setNonce] = useState(BN_ZERO);
  const [encodedOutput, setEncodedOutput] = useState<string>('');

  const [currentPair, setCurrentPair] = useState<KeyringPair | null>(keyring.getPairs()[0] || null);
  const [signature, setSignature] = useState('');

  const _onChangeAccount = useCallback(
    (accountId: string | null) => setCurrentPair(keyring.getPair(accountId || '')),
    []
  );

  const onSign = useCallback(
    (): void => {
      if (!currentPair) {
        return;
      }

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

        setEncodedOutput(dataToEncode.toString());
        setSignature(u8aToHex(
          currentPair.sign(dataToEncode)
        ));

    },
    [currentPair, relayer, from, to, token, amount, nonce]
  );

  return (
    <div className='toolbox--Hash'>

      <div className='ui--row'>
        <InputAddress
          className='full'
          help={t<string>('select the account you wish to sign data with')}
          isInput={false}
          label={t<string>('account')}
          onChange={_onChangeAccount}
          type='account'
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
      <br />
      <div className='ui--row'>
        <Output
          className='full encoded'
          help={t<string>('Encoded string value')}
          isMonospace
          label={t<string>('the resulting encoded value (as String)')}
          value={encodedOutput}
          withCopy
        />
      </div>
      <br />
      <div className='ui--row'>
        <Output
          className='full'
          help={t<string>('Signature')}
          isMonospace
          label={t<string>('the resulting signature is')}
          value={signature}
          withCopy
        />
      </div>

      <Button.Group>
        <Button
          icon='key'
          label={t<string>('Sign data')}
          onClick={onSign}
        />
      </Button.Group>

    </div>
  );
}

export default React.memo(styled(TokenManagerSign)`
  .encoded {
    margin: 2px;
  }
`);

