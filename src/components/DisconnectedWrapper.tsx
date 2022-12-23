import React from 'react';
import { useChainContext } from '../chain/ChainContext';
import ConnectScreen from '../pages/connect';

export function DisconnectedWrapper({ node, message }: { node: JSX.Element, message?: string }) {
    const chain = useChainContext();
    const address = chain.address;
    // const loggedIn = chain.loggedIn;
    const loggedIn = true; //TODO: change

    return (
        <>
            {address && loggedIn ? node : <ConnectScreen message={message} />}
        </>
    );
}
