import { UserDeleteOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';
import { AddressWithBlockies } from './AddressWithBlockies';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';

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
        <b>{title ? title : 'Add Addresses'}</b>

        <div>{icon}</div>
    </div>
}

export function AddressDisplayList(
    {
        users,
        setUsers,
        disallowedUsers,
        fontColor,
        fontSize,
        darkMode,
        title,
        hideAccountNumber,
        hideTitle,
        center
    }: {
        users: BitBadgesUserInfo[],
        setUsers?: (users: BitBadgesUserInfo[]) => void
        disallowedUsers?: { [cosmosAddress: string]: string },
        fontColor?: string
        fontSize?: number,
        darkMode?: boolean
        title?: string,
        hideAccountNumber?: boolean
        hideTitle?: boolean
        center?: boolean
    }
) {
    return <div style={{ maxHeight: 400, overflow: 'auto', color: fontColor ? fontColor : darkMode ? 'white' : undefined, fontSize: fontSize }}>
        {!hideTitle && <h3 style={{ color: fontColor ? fontColor : darkMode ? 'white' : undefined }} >{title ? title : 'Added Addresses'} ({users.length})</h3>}
        {
            users.map((user, index) => {
                let disallowedMessage = '';
                if (disallowedUsers) {
                    disallowedMessage = disallowedUsers[user.cosmosAddress];
                }

                return (
                    <div key={index} className={center ? 'flex-center' : undefined} style={{ marginRight: 8, marginTop: 4 }}>
                        <AddressDisplay
                            icon={
                                setUsers &&
                                <Tooltip title={"Remove User"}>
                                    <UserDeleteOutlined onClick={() => {
                                        setUsers(users.filter((_, i) => i !== index))
                                    }} />
                                </Tooltip>
                            }
                            showAccountNumber={!hideAccountNumber}
                            userInfo={user ? user : {} as BitBadgesUserInfo}
                            fontColor={disallowedMessage ? 'red' : fontColor}
                            fontSize={fontSize}
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
    return <>
        {title && AddressDisplayTitle({ title, icon })}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 0
        }}>
            <AddressWithBlockies
                address={userInfo.address}
                addressName={userInfo.name}
                addressAvatar={userInfo.avatar}
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