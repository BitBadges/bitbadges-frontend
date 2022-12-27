import Blockies from 'react-blockies';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { Address } from '../Address';
import { UserDeleteOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';
import { Tooltip } from 'antd';

export function AddressModalDisplayTitle(
    {
        accountNumber,
        title,
        icon
    }: {
        accountNumber: number,
        title: string | ReactNode,
        icon?: ReactNode
    }
) {
    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    }}>
        <div></div>
        <b>{title} {<>(ID #: {accountNumber === -1 ? 'None' : accountNumber})</>}</b>
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
                                </Tooltip>}
                            title={<> {"User " + (index + 1)}</>}
                            userInfo={user ? user : {} as BitBadgesUserInfo}
                        />
                    </div>
                )
            })
        }
        {
            users.length === 0 && <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <b>No Users Added</b>
            </div>
        }
    </>
}



export function AddressModalDisplay(
    {
        userInfo,
        title,
        icon
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode
    }
) {
    return <>
        {title && AddressModalDisplayTitle({ accountNumber: userInfo.accountNumber, title, icon })}
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
                <Address address={userInfo.address} chain={userInfo.chain} hideChain={true} />
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
                <Address address={userInfo.cosmosAddress} chain={userInfo.chain} hideChain={true} />
            </div>
            <div>
                <span style={{ marginLeft: 8 }}>Cosmos</span>
            </div>
        </div>
    </>
}

