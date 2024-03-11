import React, { ReactNode } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import ConnectScreen from '../../pages/connect';

export function DisconnectedWrapper({
  node,
  message,
  requireLogin,
  requiresSignature
}: {
  node: ReactNode;
  message?: string;
  requireLogin?: boolean;
  requiresSignature?: boolean;
}) {
  const chain = useChainContext();
  const connected = chain.connected;
  const loggedIn = chain.loggedIn;

  const needToConnect = requireLogin ? !loggedIn || !connected : !connected;
  const needToBeWeb2 = requiresSignature ? !connected || chain.offChainOnlyMode : false;

  return <>{needToConnect || needToBeWeb2 ? <ConnectScreen showSignatureMessage={requiresSignature} message={message} /> : node}</>;
}
