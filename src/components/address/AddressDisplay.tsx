import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { UserDeleteOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';
import { Divider, Tooltip } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { AddressWithBlockies } from './AddressWithBlockies';

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
                        <AddressDisplay
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



export function AddressDisplay(
    {
        userInfo,
        title,
        icon,
        showAccountNumber,
        fontColor,
        fontSize,
        hideChains
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean,
        fontColor?: string
        fontSize?: number,
        hideChains?: boolean
    }
) {

    let isCosmosAddressValid = true;
    try {
        COSMOS.decoder(userInfo.cosmosAddress);
    } catch (e) {
        isCosmosAddressValid = false;
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
            />
            {!hideChains &&
                <div>
                    <span style={{ marginLeft: 8 }}>{userInfo.chain}</span>
                </div>}
        </div>
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
            {!hideChains &&
                <div>
                    <span style={{ marginLeft: 8 }}>{SupportedChain.COSMOS}</span>
                </div>}
        </div>
    </>
}

