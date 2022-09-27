import React from 'react';
import { Typography, Avatar } from 'antd';
import { PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../chain_handlers_frontend/ChainContext';
import Blockies from 'react-blockies'
import { Address } from '../Address';
import { useSelector } from 'react-redux';

export function ConfirmManager({
    badge,
    setBadge
}: {
    badge: any;
    setBadge: (badge: any) => void;
}) {
    const chain = useChainContext();
    const accountInformation = useSelector((state: any) => state.user);
    const address = chain.address;
    const accountNumber = accountInformation.accountNumber;

    

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