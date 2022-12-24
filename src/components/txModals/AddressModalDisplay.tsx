import Blockies from 'react-blockies';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';

export function AddressModalDisplayTitle(
    {
        accountNumber,
        title
    }: {
        accountNumber: number,
        title: string
    }
) {
    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <b>{title} (Account ID: {accountNumber === -1 ? 'N/A' : accountNumber})</b>
    </div>
}

export function AddressModalDisplay(
    {
        userInfo,
        title
    }: {
        userInfo: BitBadgesUserInfo,
        title?: string
    }
) {
    return <>
        {title && AddressModalDisplayTitle({ accountNumber: userInfo.accountNumber, title })}
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
                <Blockies seed={userInfo.address.toLowerCase()} />
                {userInfo.address ?
                    <span style={{ marginLeft: 8 }}>{getAbbreviatedAddress(userInfo.address)}</span>
                    : <span style={{ marginLeft: 8 }}>...</span>}
                {/* TODO: blockin connect if not connected */}
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
                <Blockies seed={userInfo.cosmosAddress.toLowerCase()} />
                {userInfo.cosmosAddress ?
                    <span style={{ marginLeft: 8 }}>{getAbbreviatedAddress(userInfo.cosmosAddress)}</span>
                    : <span style={{ marginLeft: 8 }}>...</span>}
                {/* TODO: blockin connect if not connected */}
            </div>
            <div>
                <span style={{ marginLeft: 8 }}>Cosmos</span>
            </div>
        </div>
    </>
}

