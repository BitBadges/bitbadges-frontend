import { FullscreenExitOutlined, FullscreenOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Form, Input, Layout, Typography, Upload, notification } from 'antd';
import Text from 'antd/lib/typography/Text';
import { BLANK_USER_INFO, BitBadgesUserInfo, SupportedChain } from 'bitbadgesjs-utils';

import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { updateAccountInfo } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import crypto from 'crypto';
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";
import { updateAccount, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { AccountHeader } from '../../../components/badges/AccountHeader';
import { AccountButtonDisplay } from '../../../components/button-displays/AccountButtonDisplay';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../../constants';

import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import IconButton from '../../../components/display/IconButton';

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);
const EditerMarkdown = dynamic(
  () =>
    import("@uiw/react-md-editor").then((mod) => {
      return mod.default.Markdown;
    }),
  { ssr: false }
);

const { Content } = Layout;

export const MarkdownEditor = ({ markdown, setMarkdown, placeholder, height = 600 }: { height?: number, markdown: string, setMarkdown: (markdown: string) => void, placeholder?: string }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled in local storage
    const isDarkMode = !localStorage.getItem('darkMode') || localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
  }, []);

  const mode = darkMode ? 'dark' : 'light';

  return <div className='full-width' >
    <div data-color-mode={mode}>
      <MDEditor
        height={height}
        placeholder={placeholder}
        value={markdown}
        onChange={(value) => {
          setMarkdown(value ?? '');
        }}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      />
    </div>
  </div>
}

export const MarkdownDisplay = ({ markdown, showMoreHeight = 300 }: { markdown: string, showMoreHeight?: number }) => {
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

  return <div className='primary-text full-width'>
    <div data-color-mode={mode} style={{
      textAlign: 'start',
      overflow: !showMore ? 'hidden' : undefined,

      maxHeight: showMore ? undefined : showMoreHeight,
    }} id={'description' + id} ref={elemRef}>
      <EditerMarkdown source={markdown} style={{}} />
    </div>
    {
      contentHeight >= showMoreHeight && (
        <div className='flex-between flex-wrap' style={{ marginTop: '10px' }}>
          <div></div>
          <div>
            <a onClick={() => { setShowMore(!showMore) }}>
              {showMore ? <FullscreenOutlined /> : <FullscreenExitOutlined />} {showMore ? 'Show Less' : 'Show More'}
            </a>
          </div>
        </div>
      )
    }
  </div >
}

export function AccountSettings() {
  const router = useRouter();
  const chain = useChainContext();

  const signedInAccount = useAccount(chain.address);


  const [loading, setLoading] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<BitBadgesUserInfo<bigint>>(signedInAccount ?? BLANK_USER_INFO);

  const notifications = newAccount?.notifications ? newAccount.notifications : undefined;
  const twitter = newAccount?.twitter ? newAccount.twitter : '';
  const discord = newAccount?.discord ? newAccount.discord : '';
  const github = newAccount?.github ? newAccount.github : '';
  const telegram = newAccount?.telegram ? newAccount.telegram : '';
  const readme = newAccount?.readme ? newAccount.readme : '';
  const customLinks = newAccount?.customLinks ? newAccount.customLinks : [];

  const setTwitter = (twitter: string) => { setNewAccount({ ...newAccount, twitter }) };
  const setDiscord = (discord: string) => { setNewAccount({ ...newAccount, discord }) };
  const setGithub = (github: string) => { setNewAccount({ ...newAccount, github }) };
  const setTelegram = (telegram: string) => { setNewAccount({ ...newAccount, telegram }) };
  const setReadme = (readme: string) => { setNewAccount({ ...newAccount, readme }) };
  const setCustomLinks = (customLinks: any[]) => { setNewAccount({ ...newAccount, customLinks }) };
  // const setNotifications = (notifications: any) => { setNewAccount({ ...newAccount, notifications }) }

  const hiddenBadges = newAccount?.hiddenBadges ? newAccount.hiddenBadges : [];
  const customPages = newAccount?.customPages ? newAccount.customPages : {
    badges: [],
    lists: [],
  }
  const username = newAccount?.username ? newAccount.username : '';
  const setUsername = (username: string) => { setNewAccount({ ...newAccount, username }) };

  const [newCustomLinkTitle, setNewCustomLinkTitle] = useState('');
  const [newCustomLinkUrl, setNewCustomLinkUrl] = useState('');
  const [newCustomLinkImage, setNewCustomLinkImage] = useState('');


  const [fileList, setFileList] = useState<any[]>(signedInAccount?.profilePicUrl ? [{
    uid: '-1',
    name: 'profilepic.png',
    status: 'done',
    url: signedInAccount?.profilePicUrl,
  }] : []);

  useEffect(() => {
    setFileList(signedInAccount?.profilePicUrl ? [{
      uid: '-1',
      name: 'profilepic.png',
      status: 'done',
      url: signedInAccount?.profilePicUrl,
    }] : []);
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
    setNewAccount(signedInAccount);
  }, [signedInAccount]);

  const uploadButton = (
    <div className='primary-text'>
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
                marginRight: '10vw',
              }}
            >
              <AccountHeader
                addressOrUsername={chain.address}
                accountInfoOverride={newAccount}
                profilePic={fileList.length > 0 ? fileList[0].thumbUrl : newAccount?.profilePicUrl}
              />
              <Divider></Divider>
              <Divider></Divider>
              <Form
                colon={false}
                layout="vertical"
              >
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                  <b className='primary-text' style={{ fontSize: 24, textAlign: 'center' }}>Profile</b>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Username
                      </Text>
                    }
                  >

                    <Input
                      defaultValue={username}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                      }}
                      className="form-input"
                    />

                  </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Profile Pic
                      </Text>
                    }
                  >
                    <div>
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleFileChange}
                        maxCount={1}
                        accept="image/*"
                        className=''
                        showUploadList={true}
                      >
                        {uploadButton}
                      </Upload>

                    </div>
                    {chain.chain === SupportedChain.ETH &&
                      <Typography.Text strong className='secondary-text'>
                        If username or profile pic URL is not specified, we will display your ENS name / avatar.
                      </Typography.Text>}
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
                      {/* <MdEditor
                        className='primary-text inherit-bg full-width'
                        style={{ minHeight: '250px' }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                        value={readme}
                      /> */}
                      <MarkdownEditor markdown={readme} setMarkdown={setReadme} />
                    </div>
                    <Typography.Text strong className='secondary-text'>
                      This will be the first thing users see when they visit your profile. Describe yourself, your interests, your badges, your projects, etc.
                    </Typography.Text>
                  </Form.Item>
                  <br />
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        X
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
                    {twitter &&
                      <a href={"https://x.com/" + twitter} target="_blank" rel="noopener noreferrer">
                        https://x.com/{twitter}
                      </a>}

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
                    {github &&
                      <a href={"https://github.com/" + github} target="_blank" rel="noopener noreferrer">
                        https://github.com/{github}
                      </a>}
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
                    {telegram &&
                      <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
                        https://t.me/{telegram}
                      </a>}
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
                    {
                      discord &&
                      <div className='secondary-text'>
                        @{discord}
                      </div>
                    }
                  </Form.Item>
                  <br />


                  <Form.Item
                    label={
                      <div className='primary-text font-bold' style={{ textAlign: 'center' }}>
                        Add a new custom link?
                      </div>
                    }
                  >
                    <AccountButtonDisplay
                      addressOrUsername={chain.cosmosAddress}
                      accountOverride={newAccount}
                      hideDisplay
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Link Title
                      </Text>
                    }
                  >
                    <Input
                      defaultValue={newCustomLinkTitle}
                      value={newCustomLinkTitle}
                      onChange={(e) => {
                        setNewCustomLinkTitle(e.target.value);
                      }}
                      className="form-input"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Link URL
                      </Text>
                    }
                  >
                    <Input
                      defaultValue={newCustomLinkUrl}
                      value={newCustomLinkUrl}
                      onChange={(e) => {
                        setNewCustomLinkUrl(e.target.value);
                      }}
                      className="form-input"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Image URL
                      </Text>
                    }
                  >
                    <Input
                      defaultValue={newCustomLinkImage}
                      value={newCustomLinkImage}
                      onChange={(e) => {
                        setNewCustomLinkImage(e.target.value);
                      }}
                      className="form-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<></>
                    }
                  ><div className='flex-center full-width'>

                      <IconButton
                        text='Add Link'
                        src={<PlusOutlined style={{ fontSize: 16 }} />}
                        disabled={!newCustomLinkTitle || !newCustomLinkUrl}
                        // className='styled-button'
                        onClick={() => {
                          if (!newCustomLinkTitle || !newCustomLinkUrl) return;
                          const newCustomLink = {
                            title: newCustomLinkTitle,
                            url: newCustomLinkUrl,
                            image: newCustomLinkImage
                          }
                          setCustomLinks([...customLinks, newCustomLink]);
                          setNewCustomLinkTitle('');
                          setNewCustomLinkUrl('');
                          setNewCustomLinkImage('');
                        }}
                      ></IconButton>
                    </div>

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
              </ Form>
              <Divider />

              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button
                  className='landing-button'
                  disabled={loading}
                  // disabled={!regex.test(name) && name.length > 0}
                  style={{ width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
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
                          preferences: signedInAccount.notifications?.preferences !== notifications?.preferences ? notifications?.preferences : undefined,
                          antiPhishingCode: notifications?.emailVerification?.antiPhishingCode !== signedInAccount.notifications?.emailVerification?.antiPhishingCode ? notifications?.emailVerification?.antiPhishingCode : undefined,
                        }
                      };

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

                        notification.success({ message: "Account updated!", description: "You may need to refresh to display changes." });
                        if (updatedEmail) {
                          notification.info({
                            message: "Email updated",
                            description: "We have sent you an email to verify your new email address. Once you verify, you will begin receiving notifications.",
                            duration: 0
                          });
                        }
                        await router.push(`/account/${chain.cosmosAddress}`);
                      }
                    } catch (err) {
                      console.log(err);
                    }
                    setLoading(false);
                  }}
                >
                  Update Profile
                </button>
              </div>

            </ Content>
          }
        />
      }
    />
  );
}

export default AccountSettings;