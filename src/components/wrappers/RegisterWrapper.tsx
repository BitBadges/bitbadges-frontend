import React from 'react';
import { useChainContext } from '../../contexts/ChainContext';
import RegisterScreen from '../../pages/register';

export function RegisteredWrapper({ node, message }: { node: JSX.Element, message?: string }) {
    const chain = useChainContext();
    const isRegistered = chain.isRegistered;

    return (
        <>
            {isRegistered ? node : <RegisterScreen message={message} />}
        </>
    );
}
