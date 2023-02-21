import {
    GiftOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { getBlankBalance } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { ButtonDisplay, ButtonDisplayProps } from '../common/ButtonDisplay';
import { InformationDisplayCard } from '../common/InformationDisplayCard';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';


export function BalanceOverview({ collection, metadata, balance, span, setTab, refreshUserBalance }: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => void;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    span?: number;
    setTab: (tab: string) => void;
}) {
    const chain = useChainContext();
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);

    if (!collection || !metadata) return <></>;

    //TODO: Add helper messages about account being frozen / manager transfers in this card

    const buttons: ButtonDisplayProps[] = [];
    buttons.push(...[
        {
            name: <>Transfer</>,
            icon: <SwapOutlined />,
            onClick: () => { setTransferIsVisible(true) },
            tooltipMessage: !balance ? 'Note that you do not own any badges in this collection.' : `Transfer badges!`,
            // disabled: !balance
        },
        {
            name: <>Claim</>,
            icon: <GiftOutlined />,
            onClick: () => { setTab('claims') },
            tooltipMessage: `Check if you can claim this badge`,
            count: collection.claims?.filter(x => x.leaves?.indexOf(chain.cosmosAddress) >= 0).length,
            disabled: false
        },
    ]);



    return (<>
        <InformationDisplayCard
            title={'Your Badges'}
            span={span}
        >
            {
                chain.connected && buttons.length > 0 && <>
                    <ButtonDisplay buttons={buttons} />
                </>
            }
            {
                !chain.connected && <BlockinDisplay hideLogo={true} />
            }
            <div>
                {balance && <BalanceDisplay
                    collection={collection}
                    balance={balance}
                />}
            </div>
        </InformationDisplayCard>

        <CreateTxMsgTransferBadgeModal
            collection={collection}
            visible={transferIsVisible}
            setVisible={setTransferIsVisible}
            userBalance={balance ? balance : getBlankBalance()}
            refreshUserBalance={refreshUserBalance}
        />
    </>
    );
}
