import { FullscreenExitOutlined, FullscreenOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Form, Layout, Typography, Upload, notification } from 'antd';
import Text from 'antd/lib/typography/Text';
import { BitBadgesUserInfo, SupportedChain } from 'bitbadgesjs-sdk';

import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { BitBadgesApi, updateAccountInfo } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import crypto from 'crypto';
import dynamic from 'next/dynamic';
import rehypeSanitize from 'rehype-sanitize';
import { updateAccount, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { AccountHeader } from '../../../components/badges/AccountHeader';
import { AccountButtonDisplay } from '../../../components/button-displays/AccountButtonDisplay';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../../constants';

import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import { useWeb2Context } from '../../../bitbadges-api/contexts/chains/Web2Context';
import IconButton from '../../../components/display/IconButton';
import { GenericMarkdownFormInput, GenericTextFormInput, SocialsFormItems } from '../../../components/tx-timelines/form-items/MetadataForm';
import { DiscordInputNode } from '../../../integrations/auth';

const MDEditor = dynamic(async () => await import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });
const EditerMarkdown = dynamic(
  async () =>
    await import('@uiw/react-md-editor').then((mod) => {
      return mod.default.Markdown;
    }),
  { ssr: false }
);

const { Content } = Layout;

export const MarkdownEditor = ({
  markdown,
  setMarkdown,
  placeholder,
  height = 600
}: {
  height?: number;
  markdown: string;
  setMarkdown: (markdown: string) => void;
  placeholder?: string;
}) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled in local storage
    const isDarkMode = !localStorage.getItem('darkMode') || localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
  }, []);

  const mode = darkMode ? 'dark' : 'light';

  return (
    <div className="full-width">
      <div data-color-mode={mode}>
        <MDEditor
          height={height}
          placeholder={placeholder}
          value={markdown}
          onChange={(value) => {
            setMarkdown(value ?? '');
          }}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]]
          }}
        />
      </div>
    </div>
  );
};

export const MarkdownDisplay = ({ markdown, showMoreHeight = 300 }: { markdown: string; showMoreHeight?: number }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const id = useRef(crypto.randomBytes(32).toString());

  const elemRef = useRef<HTMLDivElement>(null);
  const contentHeight = elemRef.current?.clientHeight ?? 0;

  useEffect(() => {
    // Check if dark mode is enabled in local storage
    const isDarkMode = !localStorage.getItem('darkMode') || localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
  }, []);

  const mode = darkMode ? 'dark' : 'light';

  return (
    <div className="primary-text">
      <div
        data-color-mode={mode}
        style={{
          textAlign: 'start',
          overflow: !showMore ? 'hidden' : undefined,

          maxHeight: showMore ? undefined : showMoreHeight
        }}
        id={'description' + id}
        ref={elemRef}>
        <EditerMarkdown source={markdown} />
      </div>
      {contentHeight >= showMoreHeight && (
        <div className="flex-between flex-wrap" style={{ marginTop: '10px' }}>
          <div></div>
          <div>
            <a
              onClick={() => {
                setShowMore(!showMore);
              }}>
              {showMore ? <FullscreenOutlined /> : <FullscreenExitOutlined />} {showMore ? 'Show Less' : 'Show More'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export function AccountSettings() {
  const router = useRouter();
  const chain = useChainContext();

  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<BitBadgesUserInfo<bigint>>(signedInAccount?.clone() ?? BitBadgesUserInfo.BlankUserInfo());

  const notifications = newAccount?.notifications ? newAccount.notifications : undefined;
  const twitter = newAccount?.twitter ? newAccount.twitter : '';
  const discord = newAccount?.discord ? newAccount.discord : '';
  const github = newAccount?.github ? newAccount.github : '';
  const telegram = newAccount?.telegram ? newAccount.telegram : '';
  const readme = newAccount?.readme ? newAccount.readme : '';
  const customLinks = newAccount?.customLinks ? newAccount.customLinks : [];

  const web2Context = useWeb2Context();

  const approvedSignInMethods = newAccount?.approvedSignInMethods ? newAccount.approvedSignInMethods : undefined;
  const setApprovedSignInMethods = (approvedSignInMethods: { discord?: { id: string; username: string; discriminator?: string } }) => {
    setNewAccount(new BitBadgesUserInfo<bigint>({ ...newAccount, approvedSignInMethods }));
  };

  const setReadme = (readme: string) => {
    setNewAccount(new BitBadgesUserInfo<bigint>({ ...newAccount, readme }));
  };
  const setCustomLinks = (customLinks: any[]) => {
    setNewAccount(new BitBadgesUserInfo<bigint>({ ...newAccount, customLinks }));
  };

  const hiddenBadges = newAccount?.hiddenBadges ? newAccount.hiddenBadges : [];
  const customPages = newAccount?.customPages
    ? newAccount.customPages
    : {
        badges: [],
        lists: []
      };
  const username = newAccount?.username ? newAccount.username : '';
  const setUsername = (username: string) => {
    setNewAccount(new BitBadgesUserInfo<bigint>({ ...newAccount, username }));
  };

  const [newCustomLinkTitle, setNewCustomLinkTitle] = useState('');
  const [newCustomLinkUrl, setNewCustomLinkUrl] = useState('');
  const [newCustomLinkImage, setNewCustomLinkImage] = useState('');

  const [fileList, setFileList] = useState<any[]>(
    signedInAccount?.profilePicUrl
      ? [
          {
            uid: '-1',
            name: 'profilepic.png',
            status: 'done',
            url: signedInAccount?.profilePicUrl
          }
        ]
      : []
  );

  useEffect(() => {
    setFileList(
      signedInAccount?.profilePicUrl
        ? [
            {
              uid: '-1',
              name: 'profilepic.png',
              status: 'done',
              url: signedInAccount?.profilePicUrl
            }
          ]
        : []
    );
  }, [signedInAccount?.profilePicUrl]);

  const handleFileChange = (info: any) => {
    setFileList([...info.fileList]);

    //HACK
    setTimeout(() => {
      setFileList([...info.fileList]);
    }, 500);
  };

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: account settings page, update seen activity');
    if (!signedInAccount) return;
    setNewAccount(signedInAccount.clone());
  }, [signedInAccount]);

  const uploadButton = (
    <div className="primary-text">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect and sign in to view this page.'}
      node={
        <RegisteredWrapper
          node={
            <Content
              className=""
              style={{
                marginLeft: '10vw',
                marginRight: '10vw'
              }}>
              <AccountHeader
                addressOrUsername={chain.address}
                accountInfoOverride={newAccount}
                profilePic={fileList.length > 0 ? fileList[0].thumbUrl : newAccount?.profilePicUrl}
              />
              <Divider></Divider>
              <Divider></Divider>
              <Form colon={false} layout="vertical">
                <div
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                  <b className="primary-text mb-4" style={{ fontSize: 24 }}>
                    Profile
                  </b>
                  <GenericTextFormInput label="Username" value={username} setValue={setUsername} placeholder="Enter a username" />
                  <Form.Item
                    label={
                      <Text className="primary-text" strong>
                        Profile Pic
                      </Text>
                    }>
                    <div>
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleFileChange}
                        maxCount={1}
                        accept="image/*"
                        className=""
                        showUploadList={true}>
                        {uploadButton}
                      </Upload>
                    </div>
                    {chain.chain === SupportedChain.ETH && (
                      <Typography.Text strong className="secondary-text">
                        If username or profile pic URL is not specified, we will display your ENS name / avatar.
                      </Typography.Text>
                    )}
                  </Form.Item>
                  <GenericMarkdownFormInput
                    label="About"
                    value={readme}
                    setValue={setReadme}
                    placeholder="This will be the first thing users see when they visit your profile. Describe yourself, your interests, your badges, your projects, etc."
                  />
                  <br />
                  <SocialsFormItems
                    socials={{ twitter, discord, github, telegram }}
                    setSocials={({ twitter, discord, github, telegram }) => {
                      setNewAccount(new BitBadgesUserInfo<bigint>({ ...newAccount, twitter, discord, github, telegram }));
                    }}
                  />

                  <br />
                  <Form.Item
                    label={
                      <div className="primary-text font-bold" style={{ textAlign: 'center' }}>
                        Add a new custom link?
                      </div>
                    }>
                    <AccountButtonDisplay addressOrUsername={chain.cosmosAddress} accountOverride={newAccount} hideDisplay />
                  </Form.Item>

                  <GenericTextFormInput label="Link Title" value={newCustomLinkTitle} setValue={setNewCustomLinkTitle} />
                  <GenericTextFormInput label="Link URL" value={newCustomLinkUrl} setValue={setNewCustomLinkUrl} />
                  <GenericTextFormInput label="Image URL" value={newCustomLinkImage} setValue={setNewCustomLinkImage} />

                  <Form.Item label={<></>}>
                    <div className="flex-center full-width">
                      <IconButton
                        text="Add Link"
                        src={<PlusOutlined style={{ fontSize: 16 }} />}
                        disabled={!newCustomLinkTitle || !newCustomLinkUrl}
                        // className='styled-button'
                        onClick={() => {
                          if (!newCustomLinkTitle || !newCustomLinkUrl) return;
                          const newCustomLink = {
                            title: newCustomLinkTitle,
                            url: newCustomLinkUrl,
                            image: newCustomLinkImage
                          };
                          setCustomLinks([...customLinks, newCustomLink]);
                          setNewCustomLinkTitle('');
                          setNewCustomLinkUrl('');
                          setNewCustomLinkImage('');
                        }}></IconButton>
                    </div>
                  </Form.Item>
                  <Divider />
                  <b className="primary-text mb-4" style={{ fontSize: 24 }}>
                    Sign-Ins
                  </b>
                  <Form.Item
                    label={
                      <Text className="primary-text" strong>
                        Discord Sign-In
                      </Text>
                    }>
                    {approvedSignInMethods?.discord?.username ? (
                      <div className="primary-text">
                        <div className="flex primary-text">
                          <>Approved to sign in with Discord account: </>
                          <b>@{approvedSignInMethods?.discord?.username}</b>
                          <>{Number(approvedSignInMethods?.discord?.discriminator) ? '#' + approvedSignInMethods?.discord?.discriminator : ''}</>
                        </div>
                        <br />
                        <button className="landing-button" onClick={() => setApprovedSignInMethods({})}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        {!web2Context.discord.username && (
                          <div className="flex text-center primary-text">
                            <DiscordInputNode setDisabled={() => {}} />
                          </div>
                        )}
                        {web2Context.discord.username && (
                          <>
                            <div className="secondary-text">
                              You are currently signed in with Discord account: <b>@{web2Context.discord.username}</b>
                              {Number(web2Context.discord.discriminator) ? '#' + web2Context.discord.discriminator : ''}. Would you like to approve
                              this account to sign in to BitBadges?
                            </div>
                            <div className="flex flex-wrap">
                              <button
                                className="landing-button"
                                onClick={() => {
                                  setApprovedSignInMethods({
                                    discord: {
                                      id: web2Context.discord.id,
                                      username: web2Context.discord.username,
                                      discriminator: web2Context.discord.discriminator
                                    }
                                  });
                                }}>
                                Approve
                              </button>
                              <button
                                className="landing-button"
                                onClick={async () => {
                                  await BitBadgesApi.signOut({ signOutDiscord: true, signOutBlockin: false, signOutTwitter: false });
                                  web2Context.setDiscord({ username: '', discriminator: '', id: '' });
                                }}>
                                Sign Out
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </Form.Item>
                  {/*
                  <Divider />
                  <b className='primary-text' style={{ fontSize: 24, textAlign: 'center' }}>Notifications</b>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Email
                      </Text>
                    }
                  >

                    <Input
                      defaultValue={notifications?.email ?? ''}
                      value={notifications?.email ?? ''}
                      onChange={(e) => {
                        setNotifications({ ...notifications, email: e.target.value });
                      }}
                      className="form-input"
                    />
                    <div className='secondary-text'>
                      Your email is used to send you push notifications about activity on your account.
                    </div>
                    <div className='secondary-text'>
                      {signedInAccount?.notifications?.emailVerification?.verified ? <div className='secondary-text'>
                        <CheckCircleFilled style={{ color: 'green' }} /> Email verified</div> : <div className='secondary-text'>Email not verified</div>}
                    </div>

                  </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Preferences
                      </Text>
                    }
                  >
                    <div className='primary-text' style={{ textAlign: 'start' }}>
                      <CheckboxSelect title='Email for claim alerts?' value={!!notifications?.preferences?.listActivity} setValue={(value) => {
                        setNotifications({ ...notifications, preferences: { ...notifications?.preferences, listActivity: value } });
                      }} options={[
                        { label: 'No', value: false },
                        { label: 'Yes', value: true },
                      ]} />
                      <CheckboxSelect title='Email for transfer activity?' value={!!notifications?.preferences?.transferActivity} setValue={(value) => {
                        setNotifications({ ...notifications, preferences: { ...notifications?.preferences, transferActivity: value } });
                      }} options={[
                        { label: 'No', value: false },
                        { label: 'Yes', value: true },
                      ]} />
                      <CheckboxSelect title='Email for list activity?' value={!!notifications?.preferences?.claimAlerts} setValue={(value) => {
                        setNotifications({ ...notifications, preferences: { ...notifications?.preferences, claimAlerts: value } });
                      }} options={[
                        { label: 'No', value: false },
                        { label: 'Yes', value: true },
                      ]} />
                    </div>
                  </Form.Item>

                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Anti-Phishing Code
                      </Text>
                    }
                  >

                    <Input
                      defaultValue={notifications?.emailVerification?.antiPhishingCode ?? ''}
                      value={notifications?.emailVerification?.antiPhishingCode ?? ''}
                      onChange={(e) => {
                        setNotifications({ ...notifications, emailVerification: { ...notifications?.emailVerification, antiPhishingCode: e.target.value } });
                      }}
                      className="form-input"
                    />
                    <div className='secondary-text'>
                      An anti-phishing code is used to verify that emails from BitBadges are not spoofed.
                      We will provide this code in all notification emails sent to you.
                    </div>

                    </Form.Item>*/}
                </div>
              </Form>
              <Divider />

              <div
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}>
                <button
                  className="landing-button"
                  disabled={loading}
                  // disabled={!regex.test(name) && name.length > 0}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      if (!newAccount || !signedInAccount) return;
                      const data: any = {
                        twitter: twitter !== signedInAccount.twitter ? twitter : undefined,
                        discord: discord !== signedInAccount.discord ? discord : undefined,
                        github: github !== signedInAccount.github ? github : undefined,
                        telegram: telegram !== signedInAccount.telegram ? telegram : undefined,
                        // name,
                        readme: readme !== signedInAccount.readme ? readme : undefined,
                        hiddenBadges,
                        customLinks: customLinks !== signedInAccount.customLinks ? customLinks : undefined,
                        customPages,
                        username: username !== signedInAccount.username ? username : undefined,
                        profilePicImageFile: '',
                        notifications: {
                          email: signedInAccount.notifications?.email !== notifications?.email ? notifications?.email : undefined,
                          preferences:
                            signedInAccount.notifications?.preferences !== notifications?.preferences ? notifications?.preferences : undefined,
                          antiPhishingCode:
                            notifications?.emailVerification?.antiPhishingCode !== signedInAccount.notifications?.emailVerification?.antiPhishingCode
                              ? notifications?.emailVerification?.antiPhishingCode
                              : undefined
                        },
                        approvedSignInMethods: approvedSignInMethods !== signedInAccount.approvedSignInMethods ? approvedSignInMethods : undefined
                      };
                      console.log('data:', data);

                      let updatedEmail = false;
                      if (Object.keys(data.notifications).length === 0) delete data.notifications;
                      if (data.notifications?.email) {
                        updatedEmail = true;
                      }

                      let file = null;

                      if (fileList.length > 0 && fileList[0].originFileObj) {
                        file = fileList[0].originFileObj;

                        const reader = new FileReader();

                        reader.onload = async (e) => {
                          try {
                            const base64Data = e.target?.result?.toString().split(',')[1] ?? ''; // Extract the base64 data
                            data.profilePicImageFile = base64Data;

                            await updateAccountInfo(data);

                            updateAccount({
                              ...newAccount,
                              ...data
                            });
                            await router.push(`/account/${chain.cosmosAddress}`);
                          } catch (error) {
                            console.error('Error uploading file:', error);
                          }
                        };

                        reader.readAsDataURL(file);
                      } else {
                        await updateAccountInfo({
                          ...newAccount,
                          ...data,
                          profilePicUrl: fileList.length == 0 ? '' : newAccount.profilePicUrl
                        });

                        updateAccount({
                          ...newAccount,
                          ...data,
                          profilePicUrl: fileList.length == 0 ? '' : newAccount.profilePicUrl
                        });

                        notification.success({
                          message: 'Account updated!',
                          description: 'You may need to refresh to display changes.'
                        });
                        if (updatedEmail) {
                          notification.info({
                            message: 'Email updated',
                            description:
                              'We have sent you an email to verify your new email address. Once you verify, you will begin receiving notifications.',
                            duration: 0
                          });
                        }
                        await router.push(`/account/${chain.cosmosAddress}`);
                      }
                    } catch (err) {
                      console.log(err);
                    }
                    setLoading(false);
                  }}>
                  Update Profile
                </button>
              </div>
            </Content>
          }
        />
      }
    />
  );
}

export default AccountSettings;
