import { Empty, Pagination } from 'antd';
import { useState } from 'react';
import { BitBadgeCollection } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { ClaimDisplay } from '../../common/ClaimDisplay';
import { CreateTxMsgClaimBadgeModal } from '../../txModals/CreateTxMsgClaimBadge';

export function ClaimsTab({ collection, refreshUserBalance }: {
    collection: BitBadgeCollection | undefined;

    refreshUserBalance: () => void;
}) {
    const [claimId, setClaimId] = useState<number>(0);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");

    const [currPage, setCurrPage] = useState<number>(1);

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
                {activeClaims && activeClaims.length > 0 && collection &&
                    <ClaimDisplay
                        collection={collection}
                        claim={collection.claims[activeClaimIds[currPage - 1]]}
                        claimId={activeClaimIds[currPage - 1]}
                        openModal={(code) => {
                            setClaimId(activeClaimIds[currPage - 1])
                            setModalVisible(true);
                            setCode(code ? code : "");
                        }}
                    />
                }
            </div>
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
            {
                !collection?.claims.find((x) => x.balances.length > 0) &&
                <Empty
                    style={{ color: PRIMARY_TEXT }}
                    description="At the moment, there are no active claims for this badge."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            }
            <CreateTxMsgClaimBadgeModal
                collection={collection}
                refreshUserBalance={refreshUserBalance}
                claimId={claimId}
                visible={modalVisible}
                setVisible={setModalVisible}
                code={code}
            />
        </div >
    );
}

