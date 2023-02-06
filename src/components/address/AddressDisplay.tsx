import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { UserDeleteOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';
import { Divider, Tooltip, Typography } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { AddressWithBlockies } from './AddressWithBlockies';
import { ETH_LOGO } from '../../constants';
import { ethers } from 'ethers';

export function AddressDisplayTitle(
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
        fontSize: 20
    }}>
        <div></div>
        <b>{title} {showAccountNumber && <>(ID #: {accountNumber === -1 ? 'None' : accountNumber})</>}</b>
        <div style={{}}>
            {icon}
        </div>
    </div>
}

export function AddressDisplayList(
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
                        {/* {index !== 0 && <Divider style={{ margin: '15px' }} />} */}
                        <AddressDisplay
                            icon={
                                <Tooltip title={"Remove User"}>
                                    <UserDeleteOutlined onClick={() => {
                                        setUsers(users.filter((_, i) => i !== index))
                                    }} />
                                </Tooltip>
                            }
                            showAccountNumber={true}
                            // title={<> {"User " + (index + 1)}</>}
                            userInfo={user ? user : {} as BitBadgesUserInfo}
                        />

                    </div>
                )
            })
        }
    </>
}



export function AddressDisplay(
    {
        userInfo,
        title,
        icon,
        showAccountNumber,
        fontColor,
        fontSize,
        showCosmosAddress
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean,
        fontColor?: string
        fontSize?: number,
        hideChains?: boolean
        showCosmosAddress?: boolean
    }
) {

    let isValidAddress = true;
    let chainLogo = '';
    switch (userInfo.chain) {
        case SupportedChain.ETH:
            isValidAddress = ethers.utils.isAddress(userInfo.address);
            break;
        case SupportedChain.COSMOS:

            try {
                COSMOS.decoder(userInfo.address);
            } catch {
                isValidAddress = false;
            }
            break;
        default:
            chainLogo = ETH_LOGO;
            break;
    }

    return <>
        {title && AddressDisplayTitle({ accountNumber: userInfo.accountNumber, title, icon, showAccountNumber })}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <AddressWithBlockies
                address={userInfo.address}
                chain={userInfo.chain}
                fontSize={fontSize}
                fontColor={fontColor}
                accountNumber={showAccountNumber ? userInfo.accountNumber : undefined}
            />
            <div style={{ display: 'flex', alignItems: 'center' }} >
                {showAccountNumber && userInfo.accountNumber !== -1 &&
                    <div>
                        <Typography.Text strong style={{ marginLeft: 8 }}>ID #{userInfo.accountNumber}</Typography.Text>
                    </div>}
                {showAccountNumber && userInfo.accountNumber === -1 && isValidAddress &&
                    <Tooltip
                        title='This address has not been registered on the BitBadges blockchain yet. We will register it before you submit your transaction.'
                        placement='bottom'
                    >
                        <div>
                            <Typography.Text strong style={{ marginLeft: 8 }}>Unregistered</Typography.Text>
                        </div>
                    </Tooltip>
                }
                <div style={{ marginLeft: 8 }}>
                    {icon}
                </div>
            </div>

        </div>
        {showCosmosAddress &&
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <AddressWithBlockies
                    address={userInfo.cosmosAddress}
                    chain={SupportedChain.COSMOS}
                    fontSize={fontSize}
                    fontColor={fontColor}
                />

            </div>
        }
    </>
}

