import { Empty } from 'antd';
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

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
                display: 'flex',
                justifyContent: 'center',
            }}>
            {
                collection?.claims.map((claim, idx) => {
                    return <div key={idx}>
                        <ClaimDisplay
                            collection={collection}
                            claim={claim}
                            claimId={idx}
                            openModal={(code) => {
                                setClaimId(idx)
                                setModalVisible(true);
                                setCode(code ? code : "");
                            }}
                        />

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

