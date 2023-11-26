import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Layout, Typography, Upload, notification } from 'antd';
import Text from 'antd/lib/typography/Text';
import { BLANK_USER_INFO, BitBadgesUserInfo, SupportedChain } from 'bitbadgesjs-utils';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { updateAccountInfo } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { AccountButtonDisplay } from '../../../components/button-displays/AccountButtonDisplay';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { useAccount, updateAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

export function AccountSettings() {
  const router = useRouter();
  const chain = useChainContext();

  const signedInAccount = useAccount(chain.address);


  const [loading, setLoading] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<BitBadgesUserInfo<bigint>>(signedInAccount ?? BLANK_USER_INFO);


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

  const showAllByDefault = newAccount?.onlyShowApproved ? false : true;
  const shownBadges = newAccount?.shownBadges ? newAccount.shownBadges : [];
  const hiddenBadges = newAccount?.hiddenBadges ? newAccount.hiddenBadges : [];
  const customPages = newAccount?.customPages ? newAccount.customPages : [];
  const username = newAccount?.username ? newAccount.username : '';

  // const setShowAllByDefault = (showAllByDefault: boolean) => { setNewAccount({ ...newAccount, onlyShowApproved: !showAllByDefault }) };
  // const setShownBadges = (shownBadges: any[]) => { setNewAccount({ ...newAccount, shownBadges }) };
  // const setHiddenBadges = (hiddenBadges: any[]) => { setNewAccount({ ...newAccount, hiddenBadges }) };
  // const setCustomPages = (customPages: any[]) => { setNewAccount({ ...newAccount, customPages }) };
  const setUsername = (username: string) => { setNewAccount({ ...newAccount, username }) };


  const [newCustomLinkTitle, setNewCustomLinkTitle] = useState('');

  const [newCustomLinkUrl, setNewCustomLinkUrl] = useState('');

  const [newCustomLinkImage, setNewCustomLinkImage] = useState('');

  function handleEditorChange({ text }: any) {
    setReadme(text);
    // console.log('handleEditorChange', html, text);
  }

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
    setFileList(info.fileList);
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
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <RegisteredWrapper

          node={
            <Content
              className="full-area"
              style={{ minHeight: '100vh', padding: 8 }}
            >

              <AccountButtonDisplay
                hideButtons
                addressOrUsername={chain.address}
                profilePic={newAccount?.profilePicUrl}
              />
              <Divider></Divider>
              <Form
                colon={false}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
              >
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>

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
                      <MdEditor
                        className='primary-text inherit-bg full-width'
                        style={{ minHeight: '250px' }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                        value={readme}
                      />
                    </div>
                    <Typography.Text strong className='secondary-text'>
                      This will be the first thing users see when they visit your profile. Describe yourself, your interests, your badges, your projects, etc.
                    </Typography.Text>
                  </Form.Item>
                  <br />
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
                    {twitter &&
                      <a href={"https://twitter.com/" + twitter} target="_blank" rel="noopener noreferrer">
                        https://twitter.com/{twitter}
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
                      // profilePic={profilePicUrl}
                      customLinks={customLinks}
                      setCustomLinks={setCustomLinks}
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

                      <Button
                        disabled={!newCustomLinkTitle || !newCustomLinkUrl}
                        type='primary'
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
                      >Add Link</Button>
                    </div>
                  </Form.Item>
                </div>
              </Form>
              <Divider />

              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button
                  className='landing-button'
                  disabled={loading}
                  // disabled={!regex.test(name) && name.length > 0}
                  style={{ width: '80%', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      if (!newAccount) return;
                      const data = {
                        twitter,
                        discord,
                        github,
                        telegram,
                        // name,
                        readme,
                        onlyShowApproved: !showAllByDefault,
                        shownBadges,
                        hiddenBadges,
                        customLinks,
                        customPages,
                        username,
                        profilePicImageFile: ''
                      };

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
                            router.push(`/account/${chain.cosmosAddress}`);
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

                        notification.success({ message: "Account updated!", description: "It may take a couple minutes to display changes." });
                        router.push(`/account/${chain.cosmosAddress}`);
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