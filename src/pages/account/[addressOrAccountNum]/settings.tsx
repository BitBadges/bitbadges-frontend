import { Button, Form, Input, Layout } from 'antd';
import Text from 'antd/lib/typography/Text';
import { SupportedChain } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { updateAccountSettings } from '../../../bitbadges-api/api';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { useChainContext } from '../../../contexts/ChainContext';

const { Content } = Layout;

export function AccountSettings() {
    const router = useRouter();
    const chain = useChainContext();
    const { addressOrAccountNum } = router.query;

    const [loading, setLoading] = useState<boolean>(false);

    const [twitter, setTwitter] = useState(
        chain?.twitter ? chain.twitter : ''
    );

    const [discord, setDiscord] = useState(
        chain?.discord ? chain.discord : ''
    );

    const [github, setGithub] = useState(
        chain?.github ? chain.github : ''
    );

    const [telegram, setTelegram] = useState(
        chain?.telegram ? chain.telegram : ''
    );


    useEffect(() => {
        if (!chain) return;
        setTwitter(chain.twitter ? chain.twitter : '');
        setDiscord(chain.discord ? chain.discord : '');
        setGithub(chain.github ? chain.github : '');
        setTelegram(chain.telegram ? chain.telegram : '');
    }, [chain]);


    return (
        <DisconnectedWrapper
            requireLogin
            message={'Please connect your wallet and sign in to view this page.'}
            node={
                <RegisteredWrapper

                    node={
                        <Content
                            className="full-area"
                            style={{ backgroundColor: PRIMARY_BLUE, minHeight: '100vh', padding: 8 }}
                        >
                            <br />
                            <div className="primary-text" style={{ fontSize: 25, textAlign: 'center' }}>
                                Account Settings
                            </div>
                            <br />
                            <Form
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 14 }}
                                layout="horizontal"
                            >
                                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                                    <Form.Item
                                        label={<>
                                            <Text style={{ color: PRIMARY_TEXT }} strong>
                                                Name
                                            </Text>
                                        </>}
                                    >
                                        {chain &&
                                            <div style={{ color: PRIMARY_TEXT }}>
                                                {chain.chain === SupportedChain.ETH && <>
                                                    {`For ${chain.chain} names, this site uses ${chain.chain === SupportedChain.ETH ? 'Ethereum Name Service (ENS)' : ''}. Please setup your name on `}
                                                    {chain.chain === SupportedChain.ETH ?
                                                        <a href='https://ens.domains/'>

                                                            the ENS website.

                                                        </a>
                                                        : <></>}
                                                </>}
                                                {chain.chain === SupportedChain.COSMOS && <>
                                                    This site does not support Cosmos names. We are looking into adding support for Cosmos names in the future.
                                                </>}
                                            </div>}
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Text style={{ color: PRIMARY_TEXT }} strong>
                                                Twitter
                                            </Text>
                                        }
                                    >
                                        <Input
                                            defaultValue={twitter}
                                            value={twitter}
                                            onChange={(e) => {
                                                setTwitter(e.target.value);
                                            }}
                                            className="form-input"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Text style={{ color: PRIMARY_TEXT }} strong>
                                                GitHub
                                            </Text>
                                        }
                                    >
                                        <Input
                                            defaultValue={github}
                                            value={github}
                                            onChange={(e) => {
                                                setGithub(e.target.value);
                                            }}
                                            className="form-input"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Text style={{ color: PRIMARY_TEXT }} strong>
                                                Telegram
                                            </Text>
                                        }
                                    >
                                        <Input
                                            defaultValue={telegram}
                                            value={telegram}
                                            onChange={(e) => {
                                                setTelegram(e.target.value);
                                            }}
                                            className="form-input"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Text style={{ color: PRIMARY_TEXT }} strong>
                                                Discord
                                            </Text>
                                        }
                                    >
                                        <Input
                                            defaultValue={discord}
                                            value={discord}
                                            onChange={(e) => {
                                                setDiscord(e.target.value);
                                            }}
                                            className="form-input"
                                        />
                                    </Form.Item>
                                </div>
                            </Form>

                            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <Button
                                    type="primary"
                                    loading={loading}
                                    style={{ width: '80%', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                                    onClick={async () => {
                                        setLoading(true);
                                        try {

                                            const data = {
                                                twitter,
                                                discord,
                                                github,
                                                telegram,
                                            };

                                            await updateAccountSettings(data);
                                            router.push(`/account/${addressOrAccountNum}`);
                                        } catch (err) {
                                            console.log(err);
                                        }
                                        setLoading(false);
                                    }}
                                >
                                    Update
                                </Button>
                            </div>


                        </ Content>
                    }
                />
            }
        />
    );
}

export default AccountSettings;