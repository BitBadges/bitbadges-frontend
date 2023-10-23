import { Avatar, Button, Divider, Form, Input, Layout, Typography, Upload } from 'antd';
import Text from 'antd/lib/typography/Text';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { SupportedChain } from 'bitbadgesjs-utils';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { updateAccountInfo } from '../../../bitbadges-api/api';
import { useAccountsContext } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
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

  const [customLinks, setCustomLinks] = useState(
    signedInAccount?.customLinks ? signedInAccount.customLinks : []
  );

  const [newCustomLinkTitle, setNewCustomLinkTitle] = useState('');

  const [newCustomLinkUrl, setNewCustomLinkUrl] = useState('');

  const [newCustomLinkImage, setNewCustomLinkImage] = useState('');

  const [showAllByDefault, setShowAllByDefault] = useState<boolean>(
    signedInAccount?.onlyShowApproved ? false : true
  );
  // const showAllByDefault = true;

  const [shownBadges, setShownBadges] = useState(
    signedInAccount?.shownBadges ? signedInAccount.shownBadges : []
  );
  // const shownBadges: any[] = [];

  const [hiddenBadges, setHiddenBadges] = useState(
    signedInAccount?.hiddenBadges ? signedInAccount.hiddenBadges : []
  );
  // const hiddenBadges: any[] = [];

  const [customPages, setCustomPages] = useState(
    signedInAccount?.customPages ? signedInAccount.customPages : []
  );
  // const customPages: any[] = []

  const [
    username, setUsername
  ] = useState(
    signedInAccount?.username ? signedInAccount.username : ''
  );

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
    setTwitter(signedInAccount.twitter ? signedInAccount.twitter : '');
    setDiscord(signedInAccount.discord ? signedInAccount.discord : '');
    setGithub(signedInAccount.github ? signedInAccount.github : '');
    setTelegram(signedInAccount.telegram ? signedInAccount.telegram : '');
    setReadme(signedInAccount.readme ? signedInAccount.readme : '');
    setUsername(signedInAccount.username ? signedInAccount.username : '');
    setShowAllByDefault(signedInAccount.onlyShowApproved ? false : true);
    setShownBadges(signedInAccount.shownBadges ? signedInAccount.shownBadges : []);
    setHiddenBadges(signedInAccount.hiddenBadges ? signedInAccount.hiddenBadges : []);
    setCustomPages(signedInAccount.customPages ? signedInAccount.customPages : []);
    setCustomLinks(signedInAccount.customLinks ? signedInAccount.customLinks : []);

  }, [signedInAccount?.cosmosAddress]);

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
                addressOrUsername={chain.cosmosAddress}
                profilePic={signedInAccount?.profilePicUrl}
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
                        {/* <div className='flex' style={{ alignItems: 'center' }}>
                          <Button type='primary' icon={<UploadOutlined />}>Select File</Button>
                          <div className='flex primary-text' style={{ alignItems: 'center', marginLeft: 10 }}>
                            {fileList && fileList.length > 0 ? fileList[0].name : ''}
                          </div>
                        </div>
                        {/* {
                          <img src={
                            fileList && fileList.length > 0 ? fileList[0].thumbUrl : imageUrl
                          } style={{ width: '100%' }}></img>
                        } */}
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
                    {/* </Form.Item>
                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Show All Badges?
                      </Text>
                    }
                    className='primary-text'
                  >
                    <Checkbox
                      defaultChecked={showAllByDefault}
                      checked={showAllByDefault}
                      onChange={(e) => {
                        setShowAllByDefault(e.target.checked);
                      }}
                    /> */}
                    {/* <Typography.Text strong className='secondary-text'>
                      {' '}{showAllByDefault ? 'All badges ' : 'Only badges you approve'} will be shown on your profile {showAllByDefault ? 'unless you hide them' : 'and all others will be hidden'}.
                       </Typography.Text>
                    <br />
                    <Typography.Text className='secondary-text'>
                      {' '}{'You can also select to hide/show individual badges on your portfolio page. Make sure you are signed in to see the Customize Mode option.'}
                      </Typography.Text> */}
                    {/* <br />
                    <br />
                    <b>{showAllByDefault ? 'Hidden Badges' : 'Shown Badges'}</b>
                    {showAllByDefault ?
                      <>{hiddenBadges.map(x => {
                        return <div key={x.collectionId.toString()} className='flex'>
                          Collection: {x.collectionId.toString()}
                          <br />
                          Badge Ids: {x.badgeIds.map(y => {
                            return y.start == y.end ? y.start.toString() : y.start.toString() + '-' + y.end.toString()
                          }).join(', ')}
                          <br />
                          <br />
                        </div>
                      })}</>
                      :
                      <>
                        {shownBadges.map(x => {
                          return <div key={x.collectionId.toString()}>
                            {x.collectionId.toString()}
                          </div>
                        })}
                      </>
                    } */}
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
                  <br />


                  <Form.Item
                    label={
                      <Typography.Text strong className='secondary-text' style={{ textAlign: 'center' }}>
                        Add a new custom link?
                      </Typography.Text>
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
                      <Avatar
                        className='styled-button'
                        src={
                          <PlusOutlined

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
                          />} />
                    </div>
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
                      if (!signedInAccount) return;
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
                      console.log('fileList', fileList, fileList.length > 0 && fileList[0].url !== signedInAccount.profilePicUrl);
                      if (fileList.length > 0 && fileList[0].originFileObj) {
                        file = fileList[0].originFileObj;

                        const reader = new FileReader();

                        reader.onload = async (e) => {
                          try {
                            const base64Data = e.target?.result?.toString().split(',')[1] ?? ''; // Extract the base64 data
                            data.profilePicImageFile = base64Data;

                            await updateAccountInfo(data);

                            accounts.updateAccount({
                              ...signedInAccount,
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
                          ...signedInAccount,
                          ...data,
                          profilePicUrl: fileList.length == 0 ? '' : signedInAccount.profilePicUrl
                        });

                        accounts.updateAccount({
                          ...signedInAccount,
                          ...data,
                          profilePicUrl: fileList.length == 0 ? '' : signedInAccount.profilePicUrl
                        });
                        router.push(`/account/${chain.cosmosAddress}`);
                      }
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