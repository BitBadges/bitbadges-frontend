import { MintTimeline } from '../../../components/mint/MintTimeline';
import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../../../constants';
import { useChainContext } from '../../../chain/ChainContext';
import { useRouter } from 'next/router';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { getBadge } from '../../../bitbadges-api/api';
import { BitBadgeCollection } from '../../../bitbadges-api/types';

const { Content } = Layout;

function Mint() {
    const chain = useChainContext();
    const router = useRouter();
    const { id } = router.query;

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection | undefined>()

    useEffect(() => {
        if (isNaN(Number(id))) {
            return
        }

        async function getBadgeFromApi() {
            if (isNaN(Number(id))) return;

            const badgeRes = await getBadge(Number(id));
            const badgeInfo = badgeRes.badge;
            if (badgeInfo) {
                //TODO: Get actual metadata here instead of just hardcoding it
                badgeInfo.metadata = {
                    name: 'test',
                    description: 'test',
                    image: 'https://bitbadges.web.app/img/icons/logo.png'
                }

                setBadgeCollection(badgeInfo)
            } else {
                //TODO: add a 404 clause (possibly in /api)
            }
        }
        getBadgeFromApi();
    }, [id])


    return (
        <DisconnectedWrapper
            message='Please connect a wallet and sign in to access the Mint page.'
            node={
                <RegisteredWrapper
                    message='Please register to access the Mint page.'
                    node={
                        <Layout>
                            <Content
                                style={{
                                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                                    textAlign: 'center',
                                    minHeight: '100vh',
                                }}
                            >
                                <div className="primary-text">Mint</div>
                                {chain.accountNumber >= 0 && badgeCollection && chain.accountNumber !== badgeCollection.manager ?
                                    <div className="primary-text">Must be manager</div>
                                    :
                                    <div className="primary-text">TODO</div>
                                }
                            </Content>
                        </Layout>
                    }
                />
            }
        />
    );
}

export default Mint;
