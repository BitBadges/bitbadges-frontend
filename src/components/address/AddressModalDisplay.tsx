import Blockies from 'react-blockies';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { Address } from './Address';
import { UserDeleteOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';
import { Divider, Tooltip } from 'antd';
import { ethers } from 'ethers';
import { COSMOS } from 'bitbadgesjs-address-converter';

export function AddressModalDisplayTitle(
    {
        accountNumber,
        title,
        icon,
        showAccountNumber
    }: {
        accountNumber: number,
        title: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean
    }
) {
    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    }}>
        <div></div>
        <b>{title} {showAccountNumber && <>(ID #: {accountNumber === -1 ? 'None' : accountNumber})</>}</b>
        <div style={{}}>
            {icon}
        </div>
    </div>
}

export function AddressModalDisplayList(
    {
        users,
        setUsers
    }: {
        users: BitBadgesUserInfo[],
        setUsers: (users: BitBadgesUserInfo[]) => void
    }
) {
    return <>
        {
            users.map((user, index) => {
                return (
                    <div key={index}>
                        <AddressModalDisplay
                            icon={
                                <Tooltip title={"Remove User"}>
                                    <UserDeleteOutlined onClick={() => {
                                        setUsers(users.filter((_, i) => i !== index))
                                    }} />
                                </Tooltip>
                            }
                            showAccountNumber={true}
                            title={<> {"User " + (index + 1)}</>}
                            userInfo={user ? user : {} as BitBadgesUserInfo}
                        />
                        <Divider style={{ margin: '15px' }} />
                    </div>
                )
            })
        }
    </>
}



export function AddressModalDisplay(
    {
        userInfo,
        title,
        icon,
        showAccountNumber
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean
    }
) {

    let isCosmosAddressValid = true;
    try {
        COSMOS.decoder(userInfo.cosmosAddress);
    } catch (e) {
        isCosmosAddressValid = false;
    }

    return <>
        {title && AddressModalDisplayTitle({ accountNumber: userInfo.accountNumber, title, icon, showAccountNumber })}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <Blockies seed={userInfo.address ? userInfo.address.toLowerCase() : ''} />
                <Address address={userInfo.address} chain={userInfo.chain} hideChain={true}
                    fontColor={
                        userInfo.chain === SupportedChain.ETH && !ethers.utils.isAddress(userInfo.address) ? 'red' : undefined
                    }
                />
            </div>

            <div>
                <span style={{ marginLeft: 8 }}>{userInfo.chain}</span>
            </div>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <Blockies seed={userInfo.cosmosAddress ? userInfo.cosmosAddress.toLowerCase() : ''} />
                <Address address={userInfo.cosmosAddress} chain={userInfo.chain} hideChain={true}
                    fontColor={
                        !isCosmosAddressValid ? 'red' : undefined
                    }
                />
            </div>
            <div>
                <span style={{ marginLeft: 8 }}>Cosmos</span>
            </div>
        </div>
    </>
}

