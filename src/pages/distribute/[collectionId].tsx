import { Layout } from 'antd';
import { useRouter } from 'next/router';
import { TxTimeline } from '../../components/mint/TxTimeline';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';

const { Content } = Layout;

function Distribute() {
    const router = useRouter()

    const { collectionId } = router.query;
    const collectionIdNumber = Number(collectionId);

    return (
        <DisconnectedWrapper
            message='Please connect a wallet and sign in to access the Mint page.'
            node={
                <RegisteredWrapper
                    //TODO: must be manager as well (do for all pages)
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
                                <div className="primary-text">Distribute</div>
                                <div
                                    style={{
                                        marginLeft: '10vw',
                                        marginRight: '10vw',
                                        paddingLeft: '2vw',
                                        paddingRight: '2vw',
                                        paddingTop: '20px',
                                        background: PRIMARY_BLUE,
                                    }}
                                >
                                    <TxTimeline
                                        txType='DistributeBadges'
                                        collectionId={collectionIdNumber}
                                    />
                                </div>
                            </Content>
                        </Layout>
                    }
                />
            }
        />
    );
}

export default Distribute;
