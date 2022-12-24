import React from 'react';
import { Typography, Avatar } from 'antd';
import { PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../chain/ChainContext';
import Blockies from 'react-blockies'
import { Address } from '../Address';


export function ConfirmManager() {
    const chain = useChainContext();
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
                        showTooltip
                    />
                </div>
            </div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                *To use a different address, please disconnect and
                reconnect.
            </Typography>
        </div >
    )
}