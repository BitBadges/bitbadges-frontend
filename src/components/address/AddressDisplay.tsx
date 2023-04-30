import { UserDeleteOutlined } from '@ant-design/icons';
import { Pagination, Tooltip, Typography } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { AddressWithBlockies } from './AddressWithBlockies';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import collection from '../../pages/mint/collection';
import { getPageDetails } from '../../utils/pagination';
import { useAccountsContext } from '../../contexts/AccountsContext';

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
        center,
        toLength,
        pageSize = 10
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
        center?: boolean,
        toLength?: number
        pageSize? : number
    }
) {
  const accounts = useAccountsContext();
  const [currPage, setCurrPage] = useState<number>(1);

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [currPageStart, setCurrPageStart] = useState<number>(0); // Index of first badge to display
  const [currPageEnd, setCurrPageEnd] = useState<number>(0); // Index of last badge to display
  
  useEffect(() => {
      if (!collection) return;

      const currPageDetails = getPageDetails(currPage, pageSize, 0, users.length - 1);
      const currPageStart = currPageDetails.start;
      const currPageEnd = currPageDetails.end;

      setCurrPageStart(currPageStart);
      setCurrPageEnd(currPageEnd);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currPage, pageSize, users]);
    


    return <div style={{ maxHeight: 400, overflow: 'auto', color: fontColor ? fontColor : darkMode ? 'white' : undefined, fontSize: fontSize }}>
        {!hideTitle && <h3 style={{ color: fontColor ? fontColor : darkMode ? 'white' : undefined }} >{title ? title : 'Added Addresses'} ({toLength ? toLength : users.length})</h3>}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        }} >
            <Pagination
                style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT, fontSize: 14 }}
                current={currPage}
                total={users.length}
                pageSize={pageSize}

                onChange={(page) => {
                    setCurrPage(page);
                }}
                showLessItems
                showSizeChanger={false}
                size='small'
            />
        </div>
        
        {
            users.map((user, index) => {

                console.log(user);

                let disallowedMessage = '';
                if (disallowedUsers) {
                    disallowedMessage = disallowedUsers[user.cosmosAddress];
                }

                if (index < currPageStart || index > currPageEnd) return null;

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
                            userInfo={user && accounts.accounts[user.cosmosAddress] ? accounts.accounts[user.cosmosAddress] : user ? user : {} as BitBadgesUserInfo}
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
                resolvedName={userInfo.resolvedName}
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