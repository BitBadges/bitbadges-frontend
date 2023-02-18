import { UserDeleteOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { AddressWithBlockies } from './AddressWithBlockies';

export function AddressDisplayTitle(
    {
        title,
        icon,
    }: {
        title: string | ReactNode,
        icon?: ReactNode,
    }
) {

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 20
    }}>
        <b>{title ? title : 'Add Recipients'}</b>

        <div>{icon}</div>
    </div>
}

export function AddressDisplayList(
    {
        users,
        setUsers,
        disallowedUsers,
        fontColor
    }: {
        users: BitBadgesUserInfo[],
        setUsers: (users: BitBadgesUserInfo[]) => void
        disallowedUsers?: BitBadgesUserInfo[]
        fontColor?: string
    }
) {
    return <div style={{ maxHeight: 400, overflow: 'auto', }}>
        <h3>Added Recipients ({users.length})</h3>
        {
            users.map((user, index) => {
                return (
                    <div key={index} style={{ marginRight: 8 }}>
                        <AddressDisplay
                            icon={
                                <Tooltip title={"Remove User"}>
                                    <UserDeleteOutlined onClick={() => {
                                        setUsers(users.filter((_, i) => i !== index))
                                    }} />
                                </Tooltip>
                            }
                            showAccountNumber={true}
                            userInfo={user ? user : {} as BitBadgesUserInfo}
                            fontColor={disallowedUsers?.find(u => u.address === user.address) ? 'red' : fontColor}
                            hidePortfolioLink
                        />
                        <br />
                    </div>
                )
            })
        }
    </div>
}



export function AddressDisplay(
    {
        userInfo,
        title,
        icon,
        showAccountNumber,
        fontColor,
        fontSize,
        hidePortfolioLink
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean,
        fontColor?: string
        fontSize?: number,
        hideChains?: boolean
        hidePortfolioLink?: boolean
    }
) {
    return <>
        {title && AddressDisplayTitle({ title, icon })}
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
                hidePortfolioLink={hidePortfolioLink}
            />
            <div style={{ display: 'flex', alignItems: 'center', color: fontColor }} >
                {showAccountNumber && userInfo.accountNumber !== -1 &&
                    <div>
                        <Typography.Text strong style={{ marginLeft: 8, color: fontColor }}>ID #{userInfo.accountNumber}</Typography.Text>
                    </div>}
                {showAccountNumber && userInfo.accountNumber === -1 &&
                    <Tooltip
                        title='This address has not been registered on the BitBadges blockchain yet. We will register it before you submit your transaction.'
                        placement='bottom'
                    >
                        <div>
                            <Typography.Text strong style={{ marginLeft: 8, color: fontColor }}>Unregistered</Typography.Text>
                        </div>
                    </Tooltip>
                }
                <div style={{ marginLeft: 8 }}>
                    {icon}
                </div>
            </div>
        </div>
    </>
}

