import React from 'react';
import { Typography, Avatar } from 'antd';
import { PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { useChainContext } from '../../../chain/ChainContext';
import Blockies from 'react-blockies'
import { Address } from '../../address/Address';
import { useRouter } from 'next/router';


export function ConfirmManager() {
    const chain = useChainContext();
    const router = useRouter();
    const address = chain.address;

    return (
        <div>
            <div
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                }}
            >
                <Avatar
                    size={150}
                    src={
                        <Blockies
                            seed={address.toLowerCase()}
                            size={40}
                        />
                    }
                />

                <div style={{ marginBottom: 10, marginTop: 4 }}>
                    <Address
                        address={address}
                        chain={chain.chain}
                        fontColor={'lightgrey'}
                        hideChain
                    />
                </div>
            </div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: SECONDARY_TEXT,
                        fontSize: 17,
                    }}
                    onClick={() => {
                        router.push('/connect');
                    }}
                    className="opacity link-button"
                >
                    Click here to connect a different wallet.
                </button>
            </Typography>
        </div >
    )
}