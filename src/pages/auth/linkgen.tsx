import { InfoCircleOutlined, MenuUnfoldOutlined, MinusOutlined } from '@ant-design/icons';
import { Checkbox, DatePicker, Form, Input, Tooltip, Typography, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { addMetadataToIpfs, fetchMetadataDirectly } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { BalanceInput } from '../../components/balances/BalanceInput';
import { Divider } from '../../components/display/Divider';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { CheckboxSelect } from '../../components/inputs/Selects';
import { ImageSelect } from '../../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AuthCode } from '../account/codes';
import { CodeGenQueryParams } from './codegen';
const { Text } = Typography;

function BlockinCodesScreen() {
  const [messageType, setMessageType] = useState<'blockin' | 'custom'>('blockin');
  console.log(!!setMessageType);

  const chain = useChainContext();
  const [customMessage, setCustomMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [image, setImage] = useState<string>('');
  const [codeGenParams, setCodeGenParams] = useState<Required<CodeGenQueryParams>>({
    name: "",
    description: "",
    image: "ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o",

    callbackRequired: false,
    storeInAccount: true,
    allowAddressSelect: true,
    challengeParams: {
      domain: '',
      statement: '',
      address: '',
      uri: '',
      nonce: '',
      version: '1',
      chainId: '1',
      issuedAt: '',
      expirationDate: '',
      notBefore: '',
      resources: [],
      assets: [],
    },
    skipVerify: false,
    verifyOptions: {},
  });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const uriRegex = new RegExp('^(http|https|ipfs)://');


    if (!codeGenParams.name || !codeGenParams.description) {
      setErrorMessage('Please provide a name and description');
    } else if (!codeGenParams.challengeParams.domain || !codeGenParams.challengeParams.statement) {
      setErrorMessage('Please provide a domain and statement');
    } else if (!codeGenParams.image) {
      setErrorMessage('Please provide an image');
    } else if (codeGenParams.challengeParams.uri && !uriRegex.test(codeGenParams.challengeParams.uri)) {
      setErrorMessage('URI must be a valid URL');
    } else if (codeGenParams.challengeParams.domain && !uriRegex.test(codeGenParams.challengeParams.domain)) {
      setErrorMessage('Domain must be a valid URL');
    } else if (!codeGenParams.challengeParams.nonce) {
      setErrorMessage('Please provide randomness');
    } else {
      setErrorMessage('');
    }
  }, [codeGenParams]);

  // const FRONTEND_URL = "https://bitbadges.io"
  const FRONTEND_URL = "http://localhost:3000"
  let url = FRONTEND_URL + '/auth/codegen?';
  for (const [key, value] of Object.entries(codeGenParams)) {
    if (value) {
      if (typeof value === 'object') {
        const valueString = JSON.stringify(value);
        const encodedValue = encodeURIComponent(valueString);
        url = url.concat(`${key}=${encodedValue}&`);
      }
      else {
        url = url.concat(`${key}=${value}&`);
      }
    }
  }

  let verifyUrl = FRONTEND_URL + '/auth/verify?';
  for (const [key, value] of Object.entries(codeGenParams)) {
    if (value) {
      if (typeof value === 'object') {
        const valueString = JSON.stringify(value);
        const encodedValue = encodeURIComponent(valueString);
        verifyUrl = verifyUrl.concat(`${key}=${encodedValue}&`);
      }
      else {
        verifyUrl = verifyUrl.concat(`${key}=${value}&`);
      }
    }
  }

  useEffect(() => {
    async function uploadImage() {
      if (!image) return;

      const res = await addMetadataToIpfs({ collectionMetadata: { name: '', description: '', image: image } });
      const imageRes = res?.collectionMetadataResult?.cid;
      const getRes = await fetchMetadataDirectly({ uris: ['ipfs://' + imageRes] });
      const metadata = getRes.metadata[0];
      const imageToSet = metadata?.image;
      if (!imageToSet) {
        message.error(`Image upload failed.`);
        return;
      }

      setCodeGenParams({ ...codeGenParams, image: imageToSet });
    }

    uploadImage();

  }, [image]);


  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
      node={
        <div
          style={{
            marginLeft: '3vw',
            marginRight: '3vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
            minHeight: '100vh',
            textAlign: 'center'
          }}
        >
          <br />
          <div className="primary-text" style={{ fontSize: 25, textAlign: 'center', fontWeight: 'bolder' }}>
            Authentication Provider
          </div>
          <div className="secondary-text" style={{ fontSize: 15, textAlign: 'center' }}>
            <a href="https://docs.bitbadges.io/for-developers/badge-verification/generating-auth-qr-codes" target="_blank" rel="noopener noreferrer">Documentation</a>
          </div>

          <Divider />
          <div className='flex'>
            <InformationDisplayCard title='Authentication Details' md={12} xs={24} sm={24} subtitle=''>
              <div className='secondary-text' style={{ textAlign: 'center' }}>
                You, as the authentication provider, will generate a unique message that is given to those who need to authenticate.
                This message outlines everything about the sign in request in a human readable manner, including any criteria that must be met.
              </div>
              <Form colon={false} layout="vertical">
                <br />
                <Form.Item
                  label={
                    <Text
                      className='primary-text'
                      strong
                    >
                      Title
                    </Text>
                  }
                  required

                >
                  <Input
                    value={codeGenParams.name}
                    onChange={(e: any) => {
                      const statement = `${e.target.value} - ${codeGenParams.description}`;

                      setCodeGenParams({ ...codeGenParams, name: e.target.value, challengeParams: { ...codeGenParams.challengeParams, statement: statement } });

                    }}
                    style={{
                    }}
                    className='primary-text inherit-bg'
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <Text
                      className='primary-text'
                      strong
                    >
                      Description
                    </Text>
                  }
                  required

                >
                  <Input
                    value={codeGenParams.description}
                    onChange={(e: any) => {
                      const statement = `${codeGenParams.name} - ${e.target.value}`;

                      setCodeGenParams({ ...codeGenParams, description: e.target.value, challengeParams: { ...codeGenParams.challengeParams, statement: statement } });
                    }}
                    style={{
                    }}
                    className='primary-text inherit-bg'
                  />
                </Form.Item>

                <ImageSelect image={image} setImage={(image: string) => {
                  setImage(image);
                }} />

                {/* <RadioGroup
                  label=''
                  value={messageType}
                  options={[
                    {
                      label: 'Blockin',
                      value: 'blockin',
                    },
                    {
                      label: 'Custom',
                      value: 'custom',
                    },
                  ]}
                  onChange={setMessageType}
                />
                <div className='secondary-text' style={{ textAlign: 'center' }}>
                  <InfoCircleOutlined /> For proof, users will sign a message with their wallet.
                  The message can either be custom or follow the Blockin sign-in standard.
                  The Blockin standard is recommended due to more support and compatibility with tools and services.

                </div>
                <br /> */}

                {messageType !== 'blockin' && <>
                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Custom Message
                      </Text>
                    }
                    required
                  >
                    <Input
                      value={customMessage}
                      onChange={(e: any) => {
                        setCustomMessage(e.target.value);
                      }}
                      style={{
                      }}
                      className='primary-text inherit-bg'
                    />
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      Make this message unique to prevent replay attacks.
                      Replay attacks are where a message is the exact same as a prior message,
                      so a signature can be reused to authenticate multiple times.
                    </div>
                  </Form.Item>
                </>}

                {messageType === 'blockin' && <>
                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Domain / URI
                      </Text>
                    }
                    required
                  >
                    <Input
                      value={codeGenParams.challengeParams.domain}
                      onChange={(e: any) => {
                        setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, domain: e.target.value, uri: e.target.value } });
                      }}
                      style={{
                      }}
                      className='primary-text inherit-bg'
                    />
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      All authentication requests require the provider to specify a domain.
                      Consider using your BitBadges portfolio URL here, if you do not have one.
                    </div>
                  </Form.Item>

                  {/* <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Statement
                      </Text>
                    }
                    required

                  >
                    <Input.TextArea
                      autoSize
                      value={codeGenParams.challengeParams.statement}
                      onChange={(e: any) => {
                        setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, statement: e.target.value } });
                      }}
                      style={{
                      }}
                      className='primary-text inherit-bg'
                    />
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      Statement that the user will read and sign to authenticate.
                    </div>
                  </Form.Item> */}

                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Randomness
                      </Text>
                    }
                    required
                  >
                    <Input.TextArea
                      autoSize
                      value={codeGenParams.challengeParams.nonce}
                      onChange={(e: any) => {
                        setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, nonce: e.target.value } });
                      }}
                      style={{
                      }}
                      className='primary-text inherit-bg'
                    />
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      Provide a random identifier to prevent replay attacks and make your authentication message
                      unique from any prior authentication message.
                    </div>
                  </Form.Item>

                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Start Time <Tooltip color='black' title={'The earliest time that the sign in is valid.'}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Text>
                    }
                  >
                    <div className='flex-between'>
                      <div className='primary-text inherit-bg full-width'>
                        <div className='primary-text' style={{ float: 'left' }}>
                          None?
                          <Checkbox
                            checked={!codeGenParams.challengeParams.notBefore}
                            style={{ marginLeft: 5 }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: '' } });
                              } else {
                                const maxDate = new Date();
                                setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: maxDate.toISOString() } });
                              }
                            }}
                          />

                        </div>

                        {codeGenParams.challengeParams.notBefore && <>

                          <DatePicker
                            showMinute
                            showTime
                            allowClear={false}
                            placeholder='Start'
                            value={codeGenParams.challengeParams.notBefore ? moment(new Date(codeGenParams.challengeParams.notBefore)) : null}
                            className='primary-text inherit-bg full-width'
                            onChange={(_date, dateString) => {
                              if (codeGenParams.challengeParams.expirationDate && new Date(dateString).valueOf() > new Date(codeGenParams.challengeParams.expirationDate).valueOf()) {
                                alert('Start time must be before end time.');
                                return;
                              }

                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: dateString } });
                            }}
                          />
                        </>
                        }
                      </div>


                    </div>
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      When is the earliest time that the authentication is valid?
                      If no start time is specified, the authentication is valid immediately.
                    </div>
                  </Form.Item>

                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Expiration Time <Tooltip color='black' title={'The expiration time of the authentication.'}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Text>
                    }
                  >
                    <div className='flex-between'>
                      <div className='primary-text inherit-bg full-width'>
                        <div className='primary-text' style={{ float: 'left' }}>
                          None?
                          <Checkbox
                            checked={!codeGenParams.challengeParams.expirationDate}
                            style={{ marginLeft: 5 }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: '' } });
                              } else {
                                const maxDate = new Date();

                                setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: maxDate.toISOString() } });

                              }

                            }}
                          />

                        </div>

                        {codeGenParams.challengeParams.expirationDate && <>

                          <DatePicker
                            showMinute
                            showTime
                            allowClear={false}
                            placeholder='End'
                            value={codeGenParams.challengeParams.expirationDate ? moment(new Date(codeGenParams.challengeParams.expirationDate)) : null}
                            className='primary-text inherit-bg full-width'
                            onChange={(_date, dateString) => {
                              if (codeGenParams.challengeParams.notBefore && new Date(dateString).valueOf() < new Date(codeGenParams.challengeParams.notBefore).valueOf()) {
                                alert('End time must be after start time.');
                                return;
                              }

                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: dateString } });
                            }}
                          />
                        </>
                        }
                      </div>

                    </div>
                    <div className='secondary-text' style={{ textAlign: 'start' }}>
                      When does the authentication expire?
                      If no expiration time is specified, the authentication never expires.
                    </div>
                  </Form.Item>

                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Assets
                      </Text>
                    }
                  >
                    <div className='primary-text'>
                      <br />

                      <BalanceInput
                        fullWidthCards
                        isMustOwnBadgesInput
                        message="Must Own Badges"
                        timeString="Authentication Time"
                        hideOwnershipTimes
                        balancesToShow={codeGenParams.challengeParams.assets?.map(x => {
                          const badgeIds = [];
                          for (const asset of x.assetIds) {
                            if (typeof asset !== 'string') {
                              badgeIds.push(asset);
                            }
                          }
                          return {
                            ...x,
                            mustOwnAmounts: x.mustOwnAmounts,
                            amount: x.mustOwnAmounts.start,
                            badgeIds: badgeIds,
                            ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                          }
                        }) ?? []}
                        mustOwnBadges={codeGenParams.challengeParams.assets?.map(x => {
                          const badgeIds = [];
                          for (const asset of x.assetIds) {
                            if (typeof asset !== 'string') {
                              badgeIds.push(asset);
                            }
                          }
                          return {
                            collectionId: BigInt(x.collectionId),
                            overrideWithCurrentTime: true,
                            amountRange: x.mustOwnAmounts,
                            badgeIds: badgeIds,
                            ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                            mustSatisfyForAllAssets: true
                          }
                        }) ?? []}
                        onAddBadges={(balance, amountRange, collectionId, mustSatisfyForAllAssets) => {
                          if (!collectionId || !amountRange) return;

                          const newAssets = codeGenParams.challengeParams.assets ? [...codeGenParams.challengeParams.assets] : [];
                          newAssets.push({
                            assetIds: balance.badgeIds,
                            collectionId: collectionId,
                            mustOwnAmounts: amountRange,
                            chain: 'BitBadges',
                            mustSatisfyForAllAssets: !!mustSatisfyForAllAssets,
                            //no ownership times = auth time
                          });
                          setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, assets: newAssets } });

                        }}
                        onRemoveAll={() => {
                          setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, assets: [] } });
                        }}
                        // setBalances={setBalances}
                        collectionId={0n}
                      />
                    </div>

                  </Form.Item>
                  <Form.Item
                    label={
                      <Text
                        className='primary-text'
                        strong
                      >
                        Options
                      </Text>
                    }
                  >
                    <div className='primary-text'>
                      <div className='flex'>
                        <CheckboxSelect
                          title='Store in BitBadges Account?'
                          value={codeGenParams.storeInAccount}
                          disabled={codeGenParams.callbackRequired}
                          setValue={(checked) => {
                            setCodeGenParams({ ...codeGenParams, storeInAccount: checked === true });
                          }}
                          options={[
                            {
                              label: 'Yes',
                              value: true,
                            },
                            {
                              label: 'No',
                              value: false,
                            },
                          ]}
                        />
                      </div>
                      <div className='secondary-text' style={{ textAlign: 'start' }}>
                        <InfoCircleOutlined /> Should the code be stored in their BitBadges account?
                        If so, they can access it if signed in and export it to other locations (e.g. email, clipboard, etc.).
                        The code is to be manually presented to you (e.g. QR code) at authentication time.
                        If not selected and callback is not required, the code will be one-time view only.
                        If callback is required, the code will not be stored in their account, and the user will actually never see the code.
                        It is to be handled by the callback.
                      </div>
                      <br />
                      <div className='flex'>
                        <CheckboxSelect
                          title='Callback?'
                          value={codeGenParams.callbackRequired}
                          setValue={(checked) => {
                            setCodeGenParams({
                              ...codeGenParams,
                              storeInAccount: false,
                              callbackRequired: checked === true
                            });
                          }}
                          options={[
                            {
                              label: 'Yes',
                              value: true,
                            },
                            {
                              label: 'No',
                              value: false,
                            },
                          ]}
                        />
                      </div>
                      <div className='secondary-text' style={{ textAlign: 'start' }}>
                        <InfoCircleOutlined /> The URL must be opened with a popup window, and you will receive the code via a callback.
                        This is a similar process to Sign in with Google or Sign in with Facebook.
                        Requires you to have technical knowledge and have a frontend site to handle the callback (see <a href="https://docs.bitbadges.io/for-developers/badge-verification/generating-auth-qr-codes" target="_blank" rel="noopener noreferrer">here</a>).
                        If enabled, we will not store the code in their account.
                      </div>
                    </div>
                  </Form.Item>
                </>}

              </Form>


            </InformationDisplayCard>
            <InformationDisplayCard title='URL and Instructions' md={12} xs={24} sm={24} subtitle=''>
              <div className='secondary-text' style={{ textAlign: 'center' }}>
                Using the provided authentication details, we have generated a custom URL to distribute to your users.
                The URL will walk them through the process of authenticating via signing the message (i.e. generate an authentication code).
              </div>
              <br />
              {errorMessage ? <><Divider /><div style={{ color: 'red' }}>
                Error generating URL: {errorMessage}
              </div> </> : <></>}






              {!errorMessage && <>
                <div
                  className='inherit-bg primary-text flex-center'
                  style={{
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  <Tooltip title={url}>
                    <Typography.Text className='primary-text' copyable={{ text: url }} style={{ fontSize: 20 }}>
                      <a target="_blank" rel="noopener noreferrer" onClick={() => {
                        if (codeGenParams.callbackRequired) {
                          window.open(url, '_blank', 'width=600,height=600');
                        } else {
                          window.open(url, '_blank');
                        }
                      }}>
                        Custom URL
                      </a>
                    </Typography.Text>
                  </Tooltip>
                  <IconButton
                    src={!showPreview ? <MenuUnfoldOutlined /> : <MinusOutlined />}
                    text='Preview'
                    onClick={() => {
                      setShowPreview(!showPreview);
                    }}
                  />


                </div>
                <br />
                {showPreview && <>
                  <hr />
                  <br />
                  <b className='primary-text' style={{ textAlign: 'center' }}>
                    Preview
                  </b>


                  <AuthCode
                    isPreview
                    notStoredInAccount={!codeGenParams.storeInAccount}
                    authCode={{

                      //                 signature: string;
                      // name: string;
                      // description: string;
                      // image: string;
                      // cosmosAddress: string;
                      // params: ChallengeParams<T>;
                      // createdAt: T;

                      _docId: '',
                      ...codeGenParams.challengeParams,
                      params: {
                        ...codeGenParams.challengeParams,
                        address: chain.address,
                        // chain: chain.chain,
                      },
                      name: codeGenParams.name,
                      description: codeGenParams.description,
                      image: codeGenParams.image,
                      createdAt: BigInt(Date.now()),
                      signature: '0x08eb26ce592af9ea3d734a1d73c491d67f32d2a67515202de05255ef9c52472edb0918c64bb85f7b0fd774aee2ddd997449330b1c',
                      cosmosAddress: chain.cosmosAddress,
                    }}
                  />

                  {/* <button className='landing-button full-width' style={{ margin: 5, width: '100%' }} onClick={() => {
                  notification.info({
                    message: 'Preview',
                    description: 'This is just a previe of what users will see.'
                  })
                }}>
                  Sign
                </button> */}
                </>}
              </>}
              {<>
                <Divider />

                <hr />
                <br />
                <div className='flex-center'>
                  <b className='primary-text' style={{ fontSize: 20 }}>
                    Next Steps
                  </b>
                </div>
                <div style={{ textAlign: 'start' }}>


                  <div className='secondary-text'>
                    1) Navigate to the link and make sure everything works and looks good. Do a test run.
                  </div>
                  <br />

                  <div className='flex-center'>
                    <b style={{ textAlign: 'center' }}> Obtaining the Code / Signature </b>
                  </div>
                  {codeGenParams.callbackRequired && <>
                    <div className='secondary-text'>
                      2) From your frontend site, have your users open the link in a popup window. Note new tabs will not work.

                      The link will walk them through the process of authenticating via signing the message.
                      The signature of the message will then become their secret authentication code.
                      The code / signature will be shared back to you via a callback.
                      See <a href="https://docs.bitbadges.io/for-developers/badge-verification/generating-auth-qr-codes" target="_blank" rel="noopener noreferrer">here</a> for more information on how to handle the callback.

                    </div>
                    <br />
                  </>}
                  {!codeGenParams.callbackRequired && <>
                    <div className='secondary-text'>
                      2) Share the link with your users.

                      The link will walk them through the process of authenticating via signing the message.
                      The signature of the message will then become their secret authentication code.
                      The message and code / signature will be stored in their BitBadges account,
                      but they will have the option to store it elsewhere as well (e.g. in their browser, email, copy to clipboard, etc.).
                      <br />
                      <br />
                      Users will need to present their secret authentication code to you.
                      This can be done according to your preferred method.
                      Some examples include email, text, or in-person via QR code.
                      We leave this step up to you. You know your users best.
                      Consider providing instructions in the description denoting which format you expect to receive the codes in.
                    </div>
                    <br />
                  </>}
                  <div className='flex-center'>
                    <b style={{ textAlign: 'center' }}> Verification </b>

                  </div>


                  <div className='secondary-text'>
                    3) {messageType === 'blockin' && <>
                      {' '}Once the code is received, it needs to be verified with Blockin. Consider using the helper URL below. This is for a helper tool created by us to verify the codes directly in your browser.
                      Or, see here for <a href='https://docs.bitbadges.io/for-developers/badge-verification' target='_blank' rel="noopener noreferrer">more information on how to verify programmatically with Blockin</a>.
                    </>}
                    {messageType !== 'blockin' && <>
                      {' '}Once the code is received, it needs to be verified. Use <a href="https://bitbadges.io/auth/verify" target="_blank" rel="noopener noreferrer">this tool</a> created by us to verify the code directly in your browser.

                    </>}
                  </div>
                  <div className='flex-center my-2'>
                    <Tooltip title={verifyUrl}>
                      <Typography.Text className='primary-text' copyable={{ text: verifyUrl }} style={{ fontSize: 20 }}>
                        <a target="_blank" rel="noopener noreferrer" onClick={() => {
                          if (codeGenParams.callbackRequired) {
                            window.open(verifyUrl, '_blank', 'width=600,height=600');
                          } else {
                            window.open(verifyUrl, '_blank');
                          }
                        }}>
                          Custom Verification Helper URL
                        </a>
                      </Typography.Text>
                    </Tooltip>
                  </div>
                  <br />
                  <div className='secondary-text'>
                    4) {messageType === 'blockin' && <>
                      {` Blockin handles checking the user's signature and verifying ownership of specified badges (if any).
                      Any other custom requirements need to be handled by you separately (e.g. stamping users hands, checking IDs, etc.).
                      It is also critical that you prevent replay attacks and man-in-the-middle attacks. We strongly recommend codes being one-time use only to prevent these.`}
                    </>}
                    {messageType !== 'blockin' && <>
                      {' '}Step 4 only checks the signature is correct. Any other custom requirements need to be handled by you separately (e.g. stamping users hands, checking IDs, etc.).
                      IMPORTANT: This includes checking badge ownership. Badge ownership is not handled natively with custom messages like it is with Blockin.
                    </>}
                  </div>

                  <br />
                  <div className='secondary-text'>
                    5) Once everything is verified, you can authenticate the user.
                  </div>


                </div>

              </>}

            </InformationDisplayCard>
          </ div>


        </ div>
      }
    />
  );
}

export default BlockinCodesScreen;
