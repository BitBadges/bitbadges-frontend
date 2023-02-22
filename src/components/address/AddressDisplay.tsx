import { UserDeleteOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { AddressWithBlockies } from './AddressWithBlockies';
import { useAccountsContext } from '../../accounts/AccountsContext';

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
        disallowedMessages,
        fontColor,
        darkMode,
    }: {
        users: BitBadgesUserInfo[],
        setUsers?: (users: BitBadgesUserInfo[]) => void
        disallowedUsers?: BitBadgesUserInfo[],
        disallowedMessages?: string[],
        fontColor?: string
        darkMode?: boolean
    }
) {
    return <div style={{ maxHeight: 400, overflow: 'auto', color: fontColor ? fontColor : darkMode ? 'white' : undefined }}>
        <h3 style={{ color: fontColor ? fontColor : darkMode ? 'white' : undefined }} >Added Recipients ({users.length})</h3>
        {
            users.map((user, index) => {
                let isDisallowed = false;
                let isDisallowedIdx = -1;
                let disallowedMessage = '';
                if (disallowedUsers) {
                    isDisallowed = !!disallowedUsers.find(u => u.address === user.address);
                    isDisallowedIdx = disallowedUsers.findIndex(u => u.address === user.address);
                    if (disallowedMessages) disallowedMessage = disallowedMessages[isDisallowedIdx];
                }


                return (
                    <div key={index} style={{ marginRight: 8 }}>
                        <AddressDisplay
                            icon={
                                setUsers &&
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
                        {disallowedMessage && disallowedMessage.length > 0 &&
                            <div style={{ color: 'red' }}>
                                Reason: {disallowedMessage}
                            </div>
                        }
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
        hidePortfolioLink,
        hideTooltip,
        darkMode
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean,
        fontColor?: string
        fontSize?: number,
        hideChains?: boolean
        hidePortfolioLink?: boolean
        hideTooltip?: boolean
        darkMode?: boolean
    }
) {
    const accounts = useAccountsContext();

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
                addressName={accounts.accountNames[userInfo.address]}
                fontSize={fontSize}
                fontColor={fontColor ? fontColor : darkMode ? 'white' : undefined}
                accountNumber={showAccountNumber ? userInfo.accountNumber : undefined}
                hidePortfolioLink={hidePortfolioLink}
                hideTooltip={hideTooltip}
            />
            <div style={{ display: 'flex', alignItems: 'center', color: fontColor ? fontColor : darkMode ? 'white' : undefined }} >
                {showAccountNumber && userInfo.accountNumber !== -1 &&
                    <div>
                        <Typography.Text strong style={{ marginLeft: 8, color: fontColor ? fontColor : darkMode ? 'white' : undefined }}>ID #{userInfo.accountNumber}</Typography.Text>
                    </div>}
                {showAccountNumber && userInfo.accountNumber === -1 &&
                    <Tooltip
                        title='This address has not been registered on the BitBadges blockchain yet. We will register it before you submit your transaction.'
                        placement='bottom'
                    >
                        <div>
                            <Typography.Text strong style={{ marginLeft: 8, color: fontColor ? fontColor : darkMode ? 'white' : undefined }}>Unregistered</Typography.Text>
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

