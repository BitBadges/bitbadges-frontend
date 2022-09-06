import React, { useState } from 'react';
import { Layout, Typography, Avatar, Button } from 'antd';
import { PRIMARY_TEXT } from '../constants';
import { getAbbreviatedAddress } from '../utils/AddressUtils';
import { useChainContext } from '../chain_handlers_frontend/ChainContext';
import Blockies from 'react-blockies'
import { Address } from './Address';
import {
    createTxMsgRegisterAddresses,
    createTxRawEIP712,
    signatureToWeb3Extension,
} from 'bitbadgesjs-transactions';

import { cosmosToEth, ethToCosmos, ethToEthermint, evmosToEth } from 'bitbadgesjs-address-converter'
import {
    generateEndpointBroadcast,
    generatePostBodyBroadcast,
} from 'bitbadgesjs-provider'

const { Content } = Layout;

export function ConfirmManager({ setCurrStepNumber }: { setCurrStepNumber: (stepNumber: number) => void; }) {
    const chain = useChainContext();
    const [transactionIsLoading, setTransactionIsLoading] = useState(false);
    const [txnSubmitted, setTxnSubmitted] = useState(false);
    const [addressNotRegistered, setAddressNotRegistered] = useState(true); //TODO:
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
                        fontSize={'2em'}
                        showTooltip
                    />
                </div>
            </div>

            <Button
                type="primary"
                style={{ width: '100%' }}
                loading={transactionIsLoading}
                disabled={!address || txnSubmitted}
                onClick={async () => {
                    if (addressNotRegistered) {
                        setTxnSubmitted(true);
                        setTransactionIsLoading(true);

                        try {
                            const chain = {
                                chainId: 1,
                                cosmosChainId: 'bitbadges_1-1',
                            }

                            const sender = {
                                accountAddress: 'cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu',
                                sequence: 3,
                                accountNumber: 10,
                                pubkey: 'AqkV2EK+E9+ChEbZLCK0NCuWCrtUoMd04/2DANz82l/x',
                            }

                            const fee = {
                                amount: '1',
                                denom: 'token',
                                gas: '200000',
                            }

                            const memo = "asdjhsdf"

                            let msgRegisterAddressesParams = {
                                creator: 'cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu',
                                addressesToRegister: ['cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu', 'cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu'],
                            }
                            let msgRegisterAddresses = createTxMsgRegisterAddresses(chain, sender, fee, memo, msgRegisterAddressesParams)

                            console.log("BitBadges MsgRegisterAddresses", msgRegisterAddresses)
                            let msgRegisterAddressesSig = await window.ethereum.request({
                                method: 'eth_signTypedData_v4',
                                params: [cosmosToEth(sender.accountAddress), JSON.stringify(msgRegisterAddresses.eipToSign)],
                            })

                            // The chain and sender objects are the same as the previous example
                            let msgRegisterAddressesExtension = signatureToWeb3Extension(chain, sender, msgRegisterAddressesSig)
                            console.log("BitBadges MsgRegisterAddresses Extension", msgRegisterAddressesExtension)

                            // Create the txRaw
                            let rawTx = createTxRawEIP712(
                                msgRegisterAddresses.legacyAmino.body,
                                msgRegisterAddresses.legacyAmino.authInfo,
                                msgRegisterAddressesExtension,
                            )

                            // Broadcast it
                            const postOptions = {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: generatePostBodyBroadcast(rawTx),
                            }

                            let broadcastPost = await fetch(
                                `http://localhost:1317${generateEndpointBroadcast()}`,
                                postOptions,
                            )
                            let res = await broadcastPost.json()
                            console.log("BITBADGES TX MSGREGISTERADDRESSES RESPONSE FROM NODE", res)

                            setTransactionIsLoading(false);
                            setAddressNotRegistered(false);
                        } catch (err) {
                            setTxnSubmitted(false);
                            setTransactionIsLoading(false);
                        }
                    } else {
                        setCurrStepNumber(1);
                    }
                }}

            >
                {addressNotRegistered ?
                    <>Address is not registered. Would you like to register it (one-time fee)?
                    </>
                    :
                    <>
                        {address ? (
                            <>
                                {'Use ' +
                                    getAbbreviatedAddress('ETH: ' + address) + '?'}
                            </>
                        ) : (
                            'Please connect wallet.'
                        )}
                    </>}
            </Button>
            <Typography style={{ color: 'lightgrey' }}>
                *To use a different wallet, please disconnect and
                reconnect with a new wallet.
            </Typography>
        </div >
    )
}