import { UserDeleteOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { COSMOS } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { ReactNode } from 'react';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { ETH_LOGO } from '../../constants';
import { EnterMethod } from './AddressSelect';
import { AddressWithBlockies } from './AddressWithBlockies';

export function AddressDisplayTitle(
    {
        accountNumber,
        title,
        icon,
        showAccountNumber,
        enterMethod,
        setEnterMethod
    }: {
        accountNumber: number,
        title: string | ReactNode,
        icon?: ReactNode,
        showAccountNumber?: boolean
        enterMethod?: EnterMethod,
        setEnterMethod?: (enterMethod: EnterMethod) => void
    }
) {

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 20
    }}>
        {/* <br /> */}
        {/* <div></div> */}
        {/* <b>{title} {showAccountNumber && <>(ID #: {accountNumber === -1 ? 'None' : accountNumber})</>}</b> */}
        <b>Add Recipients</b>

        <div style={{}}>
            {/* {enterMethod && setEnterMethod &&
                <Select
                    defaultValue={EnterMethod.Manual}
                    style={{ width: 120, marginRight: 8 }}
                    onChange={(value: EnterMethod) => setEnterMethod(value)}
                    options={[
                        { value: EnterMethod.Manual, label: 'Manual' },
                        { value: EnterMethod.Upload, label: 'Upload' },
                    ]}
                />
            } */}
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
    return <div style={{ maxHeight: 400, overflow: 'auto' }}>
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
            isValidAddress = false;
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
            <div style={{ display: 'flex', alignItems: 'center', color: fontColor }} >
                {showAccountNumber && userInfo.accountNumber !== -1 &&
                    <div>
                        <Typography.Text strong style={{ marginLeft: 8, color: fontColor }}>ID #{userInfo.accountNumber}</Typography.Text>
                    </div>}
                {showAccountNumber && userInfo.accountNumber === -1 && isValidAddress &&
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

