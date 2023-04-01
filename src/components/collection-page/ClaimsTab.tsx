import { Button, Divider, Empty, Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { BitBadgeCollection, ClaimItem } from 'bitbadges-sdk';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { CreateTxMsgClaimBadgeModal } from '../tx-modals/CreateTxMsgClaimBadge';
import { useChainContext } from '../../contexts/ChainContext';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';
import { useRouter } from 'next/router';

export function ClaimsTab({ collection, refreshUserBalance, isPreview, codes, passwords, isModal }: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => Promise<void>;
    isPreview?: boolean;
    codes?: string[][];
    passwords?: string[];
    isModal?: boolean
}) {
    const chain = useChainContext();
    const router = useRouter();

    const [claimId, setClaimId] = useState<number>(0);
    const [claimItem, setClaimItem] = useState<ClaimItem>();
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");
    const [currPage, setCurrPage] = useState<number>(1);
    const [whitelistIndex, setWhitelistIndex] = useState<number>();
    const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

    const query = router.query;

    const activeClaimIds: number[] = []
    const activeClaims = collection ? collection?.claims.filter((x, idx) => {
        if (x.balances.length > 0) {
            activeClaimIds.push(idx + 1);
            return true;
        }
        return false;
    }) : [];


    useEffect(() => {
        if (query.claimId) {
            const idx = activeClaimIds.indexOf(Number(query.claimId));
            if (idx >= 0) {
                setCurrPage(idx + 1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.claimId, collection]);


    if (isPreview) return <Empty
        style={{ color: PRIMARY_TEXT }}
        description={
            "Claim displays are not supported for previews."
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
    />



    return (
        <div
            style={{
                color: PRIMARY_TEXT,
                justifyContent: 'center',
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                {!isModal && collection?.manager.accountNumber === chain.accountNumber && collection?.claims.find(claim => claim.hasPassword || claim.codeRoot) && <div>
                    {"To view the codes and/or passwords for this collection's claims, click the button below. This is a manager-only privilege."}
                    <br />
                    <Button
                        className='screen-button'
                        style={{ marginTop: '12px', backgroundColor: PRIMARY_BLUE }}
                        onClick={() => {
                            setFetchCodesModalIsVisible(true);
                        }}
                    >
                        {"Show Codes and Passwords"}
                    </Button>

                    <FetchCodesModal
                        visible={fetchCodesModalIsVisible}
                        setVisible={setFetchCodesModalIsVisible}
                        collection={collection}
                    />
                    <Divider />
                </div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <Pagination
                    current={currPage}
                    total={activeClaims.length}
                    pageSize={1}
                    onChange={(page) => {
                        setCurrPage(page);
                    }}
                    hideOnSinglePage
                />
            </div>


            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                {activeClaims && activeClaims.length > 0 && collection && collection.claims[activeClaimIds[currPage - 1] - 1] &&
                    <>
                        <ClaimDisplay
                            collection={collection}
                            claim={collection.claims[activeClaimIds[currPage - 1] - 1]}
                            claimId={activeClaimIds[currPage - 1]}
                            openModal={(claimItem, code, whitelistIndex) => {
                                setClaimId(activeClaimIds[currPage - 1])
                                setModalVisible(true);
                                setCode(code ? code : "");
                                setClaimItem(claimItem);
                                setWhitelistIndex(whitelistIndex);
                            }}
                            isCodeDisplay={codes ? true : false}
                            codes={codes ? codes[activeClaimIds[currPage - 1] - 1] : []}
                            claimPassword={passwords ? passwords[activeClaimIds[currPage - 1] - 1] : ''}
                        />
                    </>
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

