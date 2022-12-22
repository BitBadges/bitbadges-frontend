import Blockies from 'react-blockies';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { SupportedChain } from '../../bitbadges-api/types';

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
        accountNumber,
        address,
        cosmosAddress,
        chain,
        title
    }: {
        accountNumber: number,
        address: string,
        cosmosAddress: string,
        chain: string,
        title?: string
    }
) {
    return <>
        {title && AddressModalDisplayTitle({ accountNumber, title })}
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
                <Blockies seed={address.toLowerCase()} />
                {address ?
                    <span style={{ marginLeft: 8 }}>{getAbbreviatedAddress(address)}</span>
                    : <span style={{ marginLeft: 8 }}>...</span>}
                {/* TODO: blockin connect if not connected */}
            </div>

            <div>
                <span style={{ marginLeft: 8 }}>{chain}</span>
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
                <Blockies seed={cosmosAddress.toLowerCase()} />
                {cosmosAddress ?
                    <span style={{ marginLeft: 8 }}>{getAbbreviatedAddress(cosmosAddress)}</span>
                    : <span style={{ marginLeft: 8 }}>...</span>}
                {/* TODO: blockin connect if not connected */}
            </div>
            <div>
                <span style={{ marginLeft: 8 }}>Cosmos</span>
            </div>
        </div>
    </>
}

