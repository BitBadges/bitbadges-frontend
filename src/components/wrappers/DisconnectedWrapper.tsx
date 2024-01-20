import React from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import ConnectScreen from '../../pages/connect';

export function DisconnectedWrapper({ node, message, requireLogin }: { node: JSX.Element, message?: string, requireLogin?: boolean }) {
  const chain = useChainContext();
  const connected = chain.connected;
  const loggedIn = chain.loggedIn;

  const needToConnect = requireLogin ? !loggedIn || !connected : !connected;

  return (
    <>
      {needToConnect ? <ConnectScreen message={message} /> : node}
    </>
  );
}
