import { Button, Divider, Form, Input, Layout, Typography } from 'antd';
import Text from 'antd/lib/typography/Text';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';

import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { updateAccountInfo } from '../../../bitbadges-api/api';
import { useAccountsContext } from '../../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { AccountButtonDisplay } from '../../../components/button-displays/AccountButtonDisplay';
import { INFINITE_LOOP_MODE } from '../../../constants';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

export function AccountSettings() {
  const router = useRouter();
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const signedInAccount = accounts.getAccount(chain.cosmosAddress);

  const [loading, setLoading] = useState<boolean>(false);

  const [twitter, setTwitter] = useState(
    signedInAccount?.twitter ? signedInAccount.twitter : ''
  );

  const [discord, setDiscord] = useState(
    signedInAccount?.discord ? signedInAccount.discord : ''
  );

  const [github, setGithub] = useState(
    signedInAccount?.github ? signedInAccount.github : ''
  );

  const [telegram, setTelegram] = useState(
    signedInAccount?.telegram ? signedInAccount.telegram : ''
  );

  // const [name, setName] = useState(
  //   signedInAccount?.username ? signedInAccount.username : ''
  // );

  const [readme, setReadme] = useState(
    signedInAccount?.readme ? signedInAccount.readme : ''
  );



  // const [showAllByDefault, setShowAllByDefault] = useState<boolean>(
  //   signedInAccount?.showAllByDefault ? signedInAccount.showAllByDefault : true
  // );
  const showAllByDefault = true;

  // const [shownBadges, setShownBadges] = useState(
  //   signedInAccount?.shownBadges ? signedInAccount.shownBadges : []
  // );
  const shownBadges: any[] = [];

  // const [hiddenBadges, setHiddenBadges] = useState(
  //   signedInAccount?.hiddenBadges ? signedInAccount.hiddenBadges : []
  // );
  const hiddenBadges: any[] = [];

  // const [customPages, setCustomPages] = useState(
  //   signedInAccount?.customPages ? signedInAccount.customPages : []
  // );
  const customPages: any[] = []

  const [profilePicUrl, setProfilePicUrl] = useState(
    signedInAccount?.profilePicUrl ? signedInAccount.profilePicUrl : ''
  );

  function handleEditorChange({ text }: any) {
    setReadme(text);
    // console.log('handleEditorChange', html, text);
  }


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: account settings page, update seen activity');
    if (!signedInAccount) return;
    setTwitter(signedInAccount.twitter ? signedInAccount.twitter : '');
    setDiscord(signedInAccount.discord ? signedInAccount.discord : '');
    setGithub(signedInAccount.github ? signedInAccount.github : '');
    setTelegram(signedInAccount.telegram ? signedInAccount.telegram : '');
    setReadme(signedInAccount.readme ? signedInAccount.readme : '');
  }, [signedInAccount]);

  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <RegisteredWrapper

          node={
            <Content
              className="full-area primary-blue-bg"
              style={{ minHeight: '100vh', padding: 8 }}
            >
              <br />
              <AccountButtonDisplay
                hideButtons
                addressOrUsername={chain.cosmosAddress}
                profilePic={profilePicUrl}
              />
              <Divider></Divider>
              <Form
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
              >
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>

                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Profile Pic URL
                      </Text>
                    }
                  >

                    <Input
                      defaultValue={profilePicUrl}
                      value={profilePicUrl}
                      onChange={(e) => {
                        setProfilePicUrl(e.target.value);
                      }}
                      className="form-input"
                    />

                  </Form.Item>
                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        About
                      </Text>
                    }
                  >
                    <div className='flex-between'>
                      <MdEditor
                        className='primary-text primary-blue-bg full-width'
                        style={{ minHeight: '250px' }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                        value={readme}
                      />
                    </div>
                    <Typography.Text strong className='secondary-text'>
                      This will be the first thing users see when they visit your profile. Describe yourself, your interests, your badges, your projects, etc.
                    </Typography.Text>
                  </Form.Item>
                  {/* <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Show All Badges By Default?
                      </Text>

                    }
                  >
                    <Checkbox
                      defaultChecked={showAllByDefault}
                      checked={showAllByDefault}
                      onChange={(e) => {
                        setShowAllByDefault(e.target.checked);
                      }}
                    />
                    <Typography.Text strong className='secondary-text'>
                      {' '}If checked, all owned badges will be shown on your portfolio by default. If unchecked, only badges that you have marked as shown will be shown by default.
                    </Typography.Text>
                  </Form.Item> */}
                  {/* {!showAllByDefault &&
                    <Form.Item
                      label={
                        <Text className='primary-text' strong>
                          Shown Badges?
                        </Text>

                      }
                    >

                      <Typography.Text strong className='secondary-text'>
                        If checked, all badges will be shown by default. If unchecked, only badges that you have marked as shown will be shown by default.
                      </Typography.Text>


                    </Form.Item>} */}
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
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
                      <Text className='primary-text' strong>
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
                      <Text className='primary-text' strong>
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
                      <Text className='primary-text' strong>
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
                  // disabled={!regex.test(name) && name.length > 0}
                  style={{ width: '80%', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                  onClick={async () => {
                    setLoading(true);
                    try {

                      const data = {
                        twitter,
                        discord,
                        github,
                        telegram,
                        // name,
                        readme,
                        profilePicUrl,
                        showAllByDefault,
                        shownBadges,
                        hiddenBadges,
                        customPages
                      };

                      await updateAccountInfo(data);
                      router.push(`/account/${chain.cosmosAddress}`);
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