import React from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import RegisterScreen from '../../pages/register';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';

export function RegisteredWrapper({ node, message }: { node: JSX.Element, message?: string }) {
  const chain = useChainContext();
  const accounts = useAccountsContext();

  const signedInAccount = accounts.getAccount(chain.cosmosAddress);
  const isRegistered = signedInAccount?.accountNumber && signedInAccount?.accountNumber > 0;
  const airdropped = signedInAccount?.airdropped;

  return (
    <>
      {isRegistered && airdropped ? node : <RegisterScreen message={message} />}
    </>
  );
}
