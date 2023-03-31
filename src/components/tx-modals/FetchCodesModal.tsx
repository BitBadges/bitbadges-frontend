import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchCodes } from '../../bitbadges-api/api';
import { BitBadgeCollection } from 'bitbadges-sdk';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';



export function FetchCodesModal({ visible, setVisible, children, collection
}: {
    collection: BitBadgeCollection,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
}) {
    const chain = useChainContext();

    const [codes, setCodes] = useState<string[][]>([]);
    const [passwords, setPasswords] = useState<string[]>([]);

    useEffect(() => {
        if (collection && chain.connected && chain.loggedIn) {
            const getCodes = async () => {
                const codesRes = await fetchCodes(collection.collectionId);
                if (codesRes.codes) {
                    setCodes(codesRes.codes);
                }

                if (codesRes.passwords) {
                    setPasswords(codesRes.passwords);
                }
            }
            getCodes();
        }
    }, [collection, chain]);

    return (
        <Modal
            title={<div style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
            }}><b>{'Show Claim Codes and Passwords'}</b></div>}
            open={visible}

            style={{
                paddingLeft: '12px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                borderBottom: '0px',
            }}
            footer={null}

            width={'80%'}
            closeIcon={<div style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
            }}>{<CloseOutlined />}</div>}
            bodyStyle={{
                paddingTop: 8,
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT
            }}
            onCancel={() => setVisible(false)}
            destroyOnClose={true}
        >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {!chain.connected || !chain.loggedIn ?
                    <div style={{ textAlign: 'center' }}>
                        <BlockinDisplay />
                    </div>
                    : <ClaimsTab
                        collection={collection}
                        refreshUserBalance={async () => { }}
                        codes={codes}
                        passwords={passwords}
                        isModal
                    />}
            </div>
            {children}
        </Modal>
    );
}