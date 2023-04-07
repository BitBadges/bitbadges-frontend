import { Button, Form, Input, Layout } from 'antd';
import Text from 'antd/lib/typography/Text';
import { SupportedChain, isAddressValid } from 'bitbadges-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { updateAccountSettings } from '../../../bitbadges-api/api';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { useAccountsContext } from '../../../contexts/AccountsContext';

const { Content } = Layout;

export function AccountSettings() {
    const router = useRouter();
    const accounts = useAccountsContext();
    const { addressOrAccountNum } = router.query;

    const [cosmosAddress, setCosmosAddress] = useState<string>('');

    const accountInfo = accounts.accounts[cosmosAddress];

    useEffect(() => {
        async function getPortfolioInfo() {
            //Check if addressOrAccountNum is an address or account number and fetch portfolio accordingly
            if (!addressOrAccountNum) return;

            let fetchedInfo;
            if (isAddressValid(addressOrAccountNum as string)) {
                fetchedInfo = await accounts.fetchAccounts([addressOrAccountNum as string]);
            } else {
                fetchedInfo = await accounts.fetchAccountsByNumber([parseInt(addressOrAccountNum as string)]);
            }

            setCosmosAddress(fetchedInfo[0].cosmosAddress);
        }
        getPortfolioInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressOrAccountNum]);

    const [loading, setLoading] = useState<boolean>(false);

    const [twitter, setTwitter] = useState(
        accountInfo?.twitter ? accountInfo.twitter : ''
    );

    const [discord, setDiscord] = useState(
        accountInfo?.discord ? accountInfo.discord : ''
    );

    const [github, setGithub] = useState(
        accountInfo?.github ? accountInfo.github : ''
    );

    const [telegram, setTelegram] = useState(
        accountInfo?.telegram ? accountInfo.telegram : ''
    );


    useEffect(() => {
        if (!accountInfo) return;
        setTwitter(accountInfo.twitter ? accountInfo.twitter : '');
        setDiscord(accountInfo.discord ? accountInfo.discord : '');
        setGithub(accountInfo.github ? accountInfo.github : '');
        setTelegram(accountInfo.telegram ? accountInfo.telegram : '');
    }, [accountInfo]);


    return (
        <DisconnectedWrapper
            requireLogin
            message={'Please connect your wallet and sign in to view this page.'}
            node={
                <RegisteredWrapper

                    node={
                        <Content
                            className="full-area"
                            style={{ backgroundColor: PRIMARY_BLUE, minHeight: '100vh' }}
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
                                        {accountInfo &&
                                            <div style={{ color: PRIMARY_TEXT }}>
                                                {`For ${accountInfo.chain} names, this site uses ${accountInfo.chain === SupportedChain.ETH ? 'Ethereum Name Service (ENS)' : ''}. Please setup your name on `}
                                                {accountInfo.chain === SupportedChain.ETH ?
                                                    <a href='https://ens.domains/'>

                                                        the ENS website.

                                                    </a>
                                                    : <></>}
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