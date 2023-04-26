import { Avatar, Typography, Modal } from 'antd';
import { useRouter } from 'next/router';
import { PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { useChainContext } from '../../../contexts/ChainContext';
import { AddressDisplay } from '../../address/AddressDisplay';
import { BlockiesAvatar } from '../../address/Blockies';


export function ConfirmManager() {
    const chain = useChainContext();
    const router = useRouter();
    const address = chain.address;

    return (
        <div>
            <div
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                }}
            >
                <Avatar
                    size={150}
                    src={
                        <BlockiesAvatar
                            address={address}
                            avatar={chain.avatar}
                            fontSize={150}
                        />
                    }
                />

                <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                    <AddressDisplay
                        userInfo={{
                            address,
                            chain: chain.chain,
                            cosmosAddress: chain.cosmosAddress,
                            accountNumber: chain.accountNumber,
                        }}
                        hidePortfolioLink
                        darkMode
                    />
                </div>
            </div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: SECONDARY_TEXT,
                        fontSize: 17,
                    }}
                    onClick={() => {
                        router.push('/connect');
                        Modal.destroyAll()
                    }}
                    className="opacity link-button"
                >
                    Click here to connect a different wallet.
                </button>
            </Typography>
        </div >
    )
}