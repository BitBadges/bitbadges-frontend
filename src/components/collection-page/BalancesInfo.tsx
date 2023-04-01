import {
    GiftOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { getBlankBalance } from 'bitbadges-sdk';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from 'bitbadges-sdk';
import { useChainContext } from '../../contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { ButtonDisplay, ButtonDisplayProps } from '../display/ButtonDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { CreateTxMsgTransferBadgeModal } from '../tx-modals/CreateTxMsgTransferBadge';


export function BalanceOverview({ collection, metadata, balance, span, setTab, refreshUserBalance, isPreview }: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => Promise<void>;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    span?: number;
    setTab: (tab: string) => void;
    isPreview?: boolean;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);

    if (!collection || !metadata) return <></>;

    const buttons: ButtonDisplayProps[] = [];

    const activeClaimIds: number[] = []
    const activeClaims = collection ? collection?.claims.filter((x, idx) => {
        if (x.balances.length > 0) {
            activeClaimIds.push(idx + 1);
            return true;
        }
        return false;
    }) : [];


    buttons.push(
        {
            name: <>Transfer</>,
            icon: <SwapOutlined />,
            onClick: () => { setTransferIsVisible(true) },
            tooltipMessage: !balance ? 'Note that you do not own any badges in this collection.' : `Transfer badges!`,
            disabled: isPreview
        }
    );

    if (activeClaims.length > 0) {
        buttons.push(
            {
                name: <>Claim</>,
                icon: <GiftOutlined />,
                onClick: () => { setTab('claims') },
                tooltipMessage: `Check if you can claim this badge`,
                disabled: isPreview
            },
        );
    }



    return (<>
        <InformationDisplayCard
            title={'Your Badges'}
            span={span}
        >
            {
                chain.connected && <>
                    {buttons.length > 0 && <ButtonDisplay buttons={buttons} />}
                    <div>
                        {<BalanceDisplay
                            collection={collection}
                            balance={balance}
                        />}
                    </div>
                </>
            }
            {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            }
        </InformationDisplayCard>

        {!isPreview &&
            <CreateTxMsgTransferBadgeModal
                collection={collection}
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
                userBalance={balance ? balance : getBlankBalance()}
                refreshUserBalance={refreshUserBalance}
            />}
    </>
    );
}
