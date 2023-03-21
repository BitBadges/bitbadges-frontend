import { Empty, Pagination } from 'antd';
import { useState } from 'react';
import { BitBadgeCollection, ClaimItem } from '../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../constants';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { CreateTxMsgClaimBadgeModal } from '../tx-modals/CreateTxMsgClaimBadge';

export function ClaimsTab({ collection, refreshUserBalance, isPreview }: {
    collection: BitBadgeCollection | undefined;

    refreshUserBalance: () => Promise<void>;
    isPreview?: boolean;
}) {
    const [claimId, setClaimId] = useState<number>(0);
    const [claimItem, setClaimItem] = useState<ClaimItem>();
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");
    const [currPage, setCurrPage] = useState<number>(1);
    const [whitelistIndex, setWhitelistIndex] = useState<number>();

    if (isPreview) return <Empty
        style={{ color: PRIMARY_TEXT }}
        description={
            "Claim displays are not supported for previews."
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
    />

    const activeClaimIds: number[] = []
    const activeClaims = collection ? collection?.claims.filter((x, idx) => {
        if (x.balances.length > 0) {
            activeClaimIds.push(idx);
            return true;
        }
        return false;
    }) : [];


    return (
        <div
            style={{
                color: PRIMARY_TEXT,
                justifyContent: 'center',
            }}>
            <Pagination
                current={currPage}
                total={activeClaims.length}
                pageSize={1}
                onChange={(page) => {
                    setCurrPage(page);
                }}
                hideOnSinglePage
            />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                {activeClaims && activeClaims.length > 0 && collection && collection.claims[activeClaimIds[currPage - 1]] &&
                    <ClaimDisplay
                        collection={collection}
                        claim={collection.claims[activeClaimIds[currPage - 1]]}
                        claimId={activeClaimIds[currPage - 1]}
                        openModal={(claimItem, code, whitelistIndex) => {
                            setClaimId(activeClaimIds[currPage - 1])
                            setModalVisible(true);
                            setCode(code ? code : "");
                            setClaimItem(claimItem);
                            setWhitelistIndex(whitelistIndex);
                        }}
                    />
                }
            </div>

            {
                !collection?.claims.find((x) => x.balances.length > 0) &&
                <Empty
                    style={{ color: PRIMARY_TEXT }}
                    description="At the moment, there are no active claims for this badge."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            }
            {
                collection?.claims.map((claim, idx) => {
                    return <div key={idx}>
                        {DEV_MODE &&
                            <pre>
                                {JSON.stringify(claim, null, 2)}
                            </pre>}
                    </div>
                })
            }
            <CreateTxMsgClaimBadgeModal
                collection={collection}
                refreshUserBalance={refreshUserBalance}
                claimId={claimId}
                visible={modalVisible}
                setVisible={setModalVisible}
                code={code}
                claimItem={claimItem}
                whitelistIndex={whitelistIndex}
            />
        </div >
    );
}

