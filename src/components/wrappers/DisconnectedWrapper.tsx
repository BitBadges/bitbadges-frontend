import React from 'react';
import { useChainContext } from '../../chain/ChainContext';
import ConnectScreen from '../../pages/connect';

export function DisconnectedWrapper({ node, message, requireLogin }: { node: JSX.Element, message?: string, requireLogin?: boolean }) {
    const chain = useChainContext();
    const address = chain.address;
    const loggedIn = chain.loggedIn;

    const needToConnect = requireLogin ? !loggedIn || !address : !address;

    return (
        <>
            {needToConnect ? node : <ConnectScreen message={message} requireLogin={requireLogin}/>}
        </>
    );
}
