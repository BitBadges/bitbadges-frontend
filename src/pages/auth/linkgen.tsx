import { InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, DatePicker, Form, Input, Tooltip, Typography, message } from 'antd';
import { BalanceArray, BitBadgesAddressList, MustOwnBadges, UintRange, UintRangeArray } from 'bitbadgesjs-sdk';
import { AndGroup, ChallengeParams, OwnershipRequirements } from 'blockin/dist/types/verify.types';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { addMetadataToIpfs, fetchMetadataDirectly, getAddressLists } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { ListInfiniteScroll } from '../../components/badges/ListInfiniteScroll';
import { BalanceInput } from '../../components/balances/BalanceInput';
import { CustomizeAddRemoveListFromPage } from '../../components/display/CustomPages';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { NumberInput } from '../../components/inputs/NumberInput';
import { CheckboxSelect, RadioGroup } from '../../components/inputs/Selects';
import { Tabs } from '../../components/navigation/Tabs';
import { GenericTextFormInput, ImageSelect } from '../../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { CodeGenQueryParams } from './codegen';

const { Text } = Typography;

function BlockinCodesScreen() {
  const [messageType, setMessageType] = useState<'blockin' | 'custom'>('blockin');
  console.log(!!setMessageType);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [image, setImage] = useState<string>('');

  const [codeGenParams, setCodeGenParams] = useState<Required<CodeGenQueryParams>>({
    name: '',
    description: '',
    image: 'ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o',

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
      assetOwnershipRequirements: {
        $and: []
      }
    },
    skipVerify: false,
    verifyOptions: {},
    expectVerifySuccess: false,
    discord: {
      clientId: '',
      redirectUri: ''
    }
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

  const FRONTEND_URL = 'https://bitbadges.io';
  // const FRONTEND_URL = "http://localhost:3000"
  let url = FRONTEND_URL + '/auth/codegen?';
  for (let [key, value] of Object.entries(codeGenParams)) {
    if (key === 'challengeParams') {
      if (((value as ChallengeParams<bigint>).assetOwnershipRequirements as AndGroup<bigint>).$and.length === 0) {
        value = {
          ...((value as ChallengeParams<bigint>) ?? {}),
          assetOwnershipRequirements: undefined
        };
      }
    }

    if (value) {
      if (typeof value === 'object') {
        const valueString = JSON.stringify(value);
        const encodedValue = encodeURIComponent(valueString);
        url = url.concat(`${key}=${encodedValue}&`);
      } else {
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
      } else {
        verifyUrl = verifyUrl.concat(`${key}=${value}&`);
      }
    }
  }

  useEffect(() => {
    async function uploadImage() {
      if (!image) return;

      const res = await addMetadataToIpfs({
        collectionMetadata: { name: '', description: '', image: image }
      });
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
      message="Please connect a wallet and sign in to access this page."
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
          }}>
          <br />
          <div className="primary-text" style={{ fontSize: 25, textAlign: 'center', fontWeight: 'bolder' }}>
            Getting Started - Auth Code Provider
          </div>
          <div className="secondary-text" style={{ fontSize: 15, textAlign: 'center' }}>
            <a href="https://docs.bitbadges.io/for-developers/badge-verification/generating-auth-qr-codes" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
          </div>

          <Divider />
          <div className="flex">
            <InformationDisplayCard title="Authentication Details" md={12} xs={24} sm={24} subtitle="">
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                You, as the authentication provider, will generate a unique message that is given to those who need to authenticate. This message
                outlines everything about the sign in request in a human readable manner, including any criteria that must be met.
              </div>
              <Form colon={false} layout="vertical">
                <br />
                <GenericTextFormInput
                  label="Title"
                  required
                  value={codeGenParams.name}
                  setValue={(e) => {
                    const statement = `${e} - ${codeGenParams.description}`;

                    setCodeGenParams({
                      ...codeGenParams,
                      name: e,
                      challengeParams: { ...codeGenParams.challengeParams, statement: statement }
                    });
                  }}
                />
                <GenericTextFormInput
                  required
                  label="Description"
                  value={codeGenParams.description}
                  setValue={(e) => {
                    const statement = `${codeGenParams.name} - ${e}`;

                    setCodeGenParams({
                      ...codeGenParams,
                      description: e,
                      challengeParams: { ...codeGenParams.challengeParams, statement: statement }
                    });
                  }}
                />

                <ImageSelect
                  image={image}
                  setImage={(image: string) => {
                    setImage(image);
                  }}
                />

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

                {messageType !== 'blockin' && (
                  <>
                    <GenericTextFormInput
                      required
                      label="Custom Message"
                      value={customMessage}
                      setValue={setCustomMessage}
                      helper="Make this message unique to prevent replay attacks. Replay attacks are where a message is the exact same as a prior message, so a signature can be reused to authenticate multiple times."
                    />
                  </>
                )}

                {messageType === 'blockin' && (
                  <>
                    <GenericTextFormInput
                      required
                      label="Domain / URI"
                      value={codeGenParams.challengeParams.domain}
                      setValue={(e) => {
                        setCodeGenParams({
                          ...codeGenParams,
                          challengeParams: {
                            ...codeGenParams.challengeParams,
                            domain: e,
                            uri: e
                          }
                        });
                      }}
                      helper="All authentication requests require the provider to specify a domain. Consider using your BitBadges portfolio URL here, if you do not have one."
                    />

                    <GenericTextFormInput
                      required
                      label="Randomness"
                      value={codeGenParams.challengeParams.nonce}
                      setValue={(e) => {
                        setCodeGenParams({
                          ...codeGenParams,
                          challengeParams: {
                            ...codeGenParams.challengeParams,
                            nonce: e
                          }
                        });
                      }}
                      helper="This is a human-readable message that is presented to the user when they are signing the message."
                    />

                    <Form.Item
                      label={
                        <Text className="primary-text" strong>
                          Start Time{' '}
                          <Tooltip color="black" title={'The earliest time that the sign in is valid.'}>
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Text>
                      }>
                      <div className="flex-between">
                        <div className="primary-text inherit-bg full-width">
                          <div className="primary-text" style={{ float: 'left' }}>
                            None?
                            <Checkbox
                              checked={!codeGenParams.challengeParams.notBefore}
                              style={{ marginLeft: 5 }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      notBefore: ''
                                    }
                                  });
                                } else {
                                  const maxDate = new Date();
                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      notBefore: maxDate.toISOString()
                                    }
                                  });
                                }
                              }}
                            />
                          </div>

                          {codeGenParams.challengeParams.notBefore && (
                            <>
                              <DatePicker
                                showMinute
                                showTime
                                allowClear={false}
                                placeholder="Start"
                                value={codeGenParams.challengeParams.notBefore ? moment(new Date(codeGenParams.challengeParams.notBefore)) : null}
                                className="primary-text inherit-bg full-width"
                                onChange={(_date, dateString) => {
                                  if (
                                    codeGenParams.challengeParams.expirationDate &&
                                    new Date(dateString).valueOf() > new Date(codeGenParams.challengeParams.expirationDate).valueOf()
                                  ) {
                                    alert('Start time must be before end time.');
                                    return;
                                  }

                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      notBefore: dateString
                                    }
                                  });
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="secondary-text" style={{ textAlign: 'start' }}>
                        When is the earliest time that the authentication is valid? If no start time is specified, the authentication is valid
                        immediately.
                      </div>
                    </Form.Item>

                    <Form.Item
                      label={
                        <Text className="primary-text" strong>
                          Expiration Time{' '}
                          <Tooltip color="black" title={'The expiration time of the authentication.'}>
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Text>
                      }>
                      <div className="flex-between">
                        <div className="primary-text inherit-bg full-width">
                          <div className="primary-text" style={{ float: 'left' }}>
                            None?
                            <Checkbox
                              checked={!codeGenParams.challengeParams.expirationDate}
                              style={{ marginLeft: 5 }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      expirationDate: ''
                                    }
                                  });
                                } else {
                                  const maxDate = new Date();

                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      expirationDate: maxDate.toISOString()
                                    }
                                  });
                                }
                              }}
                            />
                          </div>

                          {codeGenParams.challengeParams.expirationDate && (
                            <>
                              <DatePicker
                                showMinute
                                showTime
                                allowClear={false}
                                placeholder="End"
                                value={
                                  codeGenParams.challengeParams.expirationDate ? moment(new Date(codeGenParams.challengeParams.expirationDate)) : null
                                }
                                className="primary-text inherit-bg full-width"
                                onChange={(_date, dateString) => {
                                  if (
                                    codeGenParams.challengeParams.notBefore &&
                                    new Date(dateString).valueOf() < new Date(codeGenParams.challengeParams.notBefore).valueOf()
                                  ) {
                                    alert('End time must be after start time.');
                                    return;
                                  }

                                  setCodeGenParams({
                                    ...codeGenParams,
                                    challengeParams: {
                                      ...codeGenParams.challengeParams,
                                      expirationDate: dateString
                                    }
                                  });
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="secondary-text" style={{ textAlign: 'start' }}>
                        When does the authentication expire? If no expiration time is specified, the authentication never expires.
                      </div>
                    </Form.Item>

                    <Form.Item
                      label={
                        <Text className="primary-text" strong>
                          Ownership Requirements
                        </Text>
                      }>
                      <AssetConditionGroupSelect
                        assetOwnershipRequirements={codeGenParams.challengeParams.assetOwnershipRequirements as AndGroup<bigint>}
                        setAssetOwnershipRequirements={(x) => {
                          setCodeGenParams({
                            ...codeGenParams,
                            challengeParams: { ...codeGenParams.challengeParams, assetOwnershipRequirements: x }
                          });
                        }}
                      />
                    </Form.Item>
                    <br />
                    <Form.Item
                      label={
                        <Text className="primary-text" strong>
                          Options
                        </Text>
                      }>
                      <div className="primary-text">
                        <div className="flex">
                          <CheckboxSelect
                            title="Callback?"
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
                                value: true
                              },
                              {
                                label: 'No',
                                value: false
                              }
                            ]}
                          />
                        </div>
                        <div className="secondary-text" style={{ textAlign: 'start' }}>
                          <InfoCircleOutlined /> The URL must be opened with a popup window, and you will receive the code via a callback. This is a
                          similar process to Sign in with Google or Sign in with Facebook. Requires you to have technical knowledge and have a
                          frontend site to handle the callback (see{' '}
                          <a
                            href="https://docs.bitbadges.io/for-developers/badge-verification/generating-auth-qr-codes"
                            target="_blank"
                            rel="noopener noreferrer">
                            here
                          </a>
                          ). If enabled, we will not store the code in their account.
                        </div>
                        <br />
                        <div className="flex">
                          <CheckboxSelect
                            title="Store in BitBadges Account?"
                            value={codeGenParams.storeInAccount}
                            disabled={codeGenParams.callbackRequired}
                            setValue={(checked) => {
                              setCodeGenParams({
                                ...codeGenParams,
                                storeInAccount: checked === true
                              });
                            }}
                            options={[
                              {
                                label: 'Yes',
                                value: true
                              },
                              {
                                label: 'No',
                                value: false
                              }
                            ]}
                          />
                        </div>
                        <div className="secondary-text" style={{ textAlign: 'start' }}>
                          <InfoCircleOutlined /> Should the code be stored in their BitBadges account? If so, they can access it if signed in and
                          export it to other locations (e.g. email, clipboard, etc.). The code is to be manually presented to you (e.g. QR code) at
                          authentication time. If not selected and callback is not required, the code will be one-time view only. If callback is
                          required, the code will not be stored in their account, and the user will actually never see the code. It is to be handled
                          by the callback.
                        </div>
                        <br />

                        <div className="flex">
                          <CheckboxSelect
                            title="Expect success at sign time?"
                            value={codeGenParams.expectVerifySuccess}
                            setValue={(checked) => {
                              setCodeGenParams({
                                ...codeGenParams,
                                expectVerifySuccess: checked === true
                              });
                            }}
                            options={[
                              {
                                label: 'Yes',
                                value: true
                              },
                              {
                                label: 'No',
                                value: false
                              }
                            ]}
                          />
                        </div>
                        <div className="secondary-text" style={{ textAlign: 'start' }}>
                          <InfoCircleOutlined /> When users navigate to the URL and sign, is verification expected to pass instantly? If so, we can
                          optimize the expeirence by catching errors earlier (before they sign) and warn to enhance their experience. An example where
                          it may not is if you have not distributed the badges yet, or the authentication times are not yet valid.
                        </div>
                        <br />

                        <div className="flex">
                          <b>Discord Server Gating?</b>
                        </div>
                        <div className="secondary-text" style={{ textAlign: 'start' }}>
                          <InfoCircleOutlined /> If you are using this link to gate a Discord server (see{' '}
                          <a
                            href="https://docs.bitbadges.io/for-developers/tutorials/badge-gating-discord-servers"
                            target="_blank"
                            rel="noopener noreferrer">
                            here
                          </a>
                          ), you can provide your Discord Client ID and Redirect URI. With this, we will first prompt the user to sign your challenge
                          message, then we prompt them to authenticate with Discord, and finally, we pass all the info back for you to handle via a
                          callback route where you can assign roles, gate channels, etc.
                        </div>
                        <Input
                          value={codeGenParams.discord.clientId}
                          onChange={(e) => {
                            setCodeGenParams({
                              ...codeGenParams,
                              discord: { ...codeGenParams.discord, clientId: e.target.value }
                            });
                          }}
                          className="primary-text inherit-bg my-2"
                          placeholder="Discord Client ID"
                        />
                        <Input
                          value={codeGenParams.discord.redirectUri}
                          onChange={(e) => {
                            setCodeGenParams({
                              ...codeGenParams,
                              discord: { ...codeGenParams.discord, redirectUri: e.target.value }
                            });
                          }}
                          className="primary-text inherit-bg my-2"
                          placeholder="Discord Redirect URI"
                        />
                      </div>
                    </Form.Item>
                  </>
                )}
              </Form>
            </InformationDisplayCard>
            <InformationDisplayCard title="URL and Instructions" md={12} xs={24} sm={24} subtitle="">
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                Using the provided authentication details, we have generated a custom URL to distribute to your users. The URL will walk them through
                the process of authenticating via signing the message (i.e. generate an authentication code).
              </div>
              <br />
              {errorMessage ? (
                <>
                  <Divider />
                  <div style={{ color: 'red' }}>Error generating URL: {errorMessage}</div>{' '}
                </>
              ) : (
                <></>
              )}

              {!errorMessage && (
                <>
                  <div
                    className="inherit-bg primary-text flex-center"
                    style={{
                      textAlign: 'center',
                      marginTop: 16
                    }}>
                    <Tooltip title={url}>
                      <Typography.Text className="primary-text" copyable={{ text: url }} style={{ fontSize: 20 }}>
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
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
                  </div>
                </>
              )}
              {
                <>
                  <Divider />

                  <hr />
                  <br />
                  <div className="flex-center">
                    <b className="primary-text" style={{ fontSize: 20 }}>
                      Next Steps
                    </b>
                  </div>
                  <div style={{ textAlign: 'start' }}>
                    <div className="secondary-text">1) Navigate to the link and make sure everything works and looks good. Do a test run.</div>
                    <br />

                    <div className="flex-center">
                      <b style={{ textAlign: 'center' }}> Obtaining the Code / Signature </b>
                    </div>
                    {codeGenParams.callbackRequired && (
                      <>
                        <div className="secondary-text">
                          2) From your frontend site, have your users open the link in a popup window. Note new tabs will not work. The link will walk
                          them through the process of authenticating via signing the message. The signature of the message will then become their
                          secret authentication code. The code / signature will be shared back to you via a callback. See{' '}
                          <a
                            href="https://blockin.gitbook.io/blockin/developer-docs/getting-started/sign-in-with-bitbadges"
                            target="_blank"
                            rel="noopener noreferrer">
                            here
                          </a>{' '}
                          for more information on how to handle the callback.
                        </div>
                        <br />
                      </>
                    )}
                    {!codeGenParams.callbackRequired && (
                      <>
                        <div className="secondary-text">
                          2) Share the link with your users. The link will walk them through the process of authenticating via signing the message.
                          The signature of the message will then become their secret authentication code.
                          {codeGenParams.storeInAccount && (
                            <>
                              You have selected that the message and code / signature will be stored in their BitBadges account. It will be stored
                              there, but they will have the option to store it elsewhere as well (e.g. in their browser, email, copy to clipboard,
                              etc.).
                            </>
                          )}
                          {!codeGenParams.storeInAccount && (
                            <>
                              You have selected that the message and code / signature will not be stored in their BitBadges account. The code will be
                              one-time view only, and they must store it elsewhere (e.g. in their browser, email, copy to clipboard, etc.).
                            </>
                          )}
                          <br />
                          <br />
                          Users will need to present their secret authentication code to you. This can be done according to your preferred method.
                          Some examples include email, text, or in-person via QR code. We leave this step up to you. You know your users and your
                          application best. Consider providing instructions in the description denoting which format you expect to receive the codes
                          in.
                        </div>
                        <br />
                      </>
                    )}
                    <div className="flex-center">
                      <b style={{ textAlign: 'center' }}> Verification </b>
                    </div>

                    <div className="secondary-text">
                      3){' '}
                      {messageType === 'blockin' && (
                        <>
                          {' '}
                          Once the code is received, it needs to be verified with Blockin. For simple use cases, consider using the helper URL below.
                          This is for a helper tool created by us to verify the codes directly in your browser. Or, see here for{' '}
                          <a
                            href="https://blockin.gitbook.io/blockin/developer-docs/getting-started/sign-in-with-bitbadges"
                            target="_blank"
                            rel="noopener noreferrer">
                            more information on how to verify programmatically with Blockin
                          </a>
                          .
                        </>
                      )}
                      {messageType !== 'blockin' && (
                        <>
                          {' '}
                          Once the code is received, it needs to be verified. Use{' '}
                          <a href="https://bitbadges.io/auth/verify" target="_blank" rel="noopener noreferrer">
                            this tool
                          </a>{' '}
                          created by us to verify the code directly in your browser.
                        </>
                      )}
                    </div>
                    <div className="flex-center my-2">
                      <Tooltip title={verifyUrl}>
                        <Typography.Text className="primary-text" copyable={{ text: verifyUrl }} style={{ fontSize: 20 }}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
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
                    <div className="secondary-text">
                      4){' '}
                      {messageType === 'blockin' && (
                        <>
                          {` Blockin handles checking the user's signature and verifying ownership of specified badges (if any).
                      Any other custom requirements need to be handled by you separately (e.g. stamping users hands, checking IDs, etc.).
                      It is also critical that you prevent replay attacks, man-in-the-middle attacks, and flash ownership attacks (if verifying with assets). We strongly recommend codes, assets, and addresses being one-time use only to prevent these.`}
                        </>
                      )}
                      {messageType !== 'blockin' && (
                        <>
                          {' '}
                          Step 4 only checks the signature is correct. Any other custom requirements need to be handled by you separately (e.g.
                          stamping users hands, checking IDs, etc.). IMPORTANT: This includes checking badge ownership. Badge ownership is not handled
                          natively with custom messages like it is with Blockin.
                        </>
                      )}
                    </div>

                    <br />
                    <div className="secondary-text">5) Once everything is verified, you can authenticate the user.</div>
                  </div>
                </>
              }
            </InformationDisplayCard>
          </div>
        </div>
      }
    />
  );
}

export const AssetConditionGroupSelect = ({
  assetOwnershipRequirements,
  setAssetOwnershipRequirements
}: {
  assetOwnershipRequirements: AndGroup<bigint>;
  setAssetOwnershipRequirements: (x: AndGroup<bigint>) => void;
}) => {
  const chain = useChainContext();
  const [lists, setLists] = useState<Array<BitBadgesAddressList<bigint>>>([]);
  const [tab, setTab] = useState<string>('badges');

  const mustBeOnLists = useMemo(() => {
    return (assetOwnershipRequirements as AndGroup<bigint>).$and
      .map((x) => {
        const assetGroup = x as OwnershipRequirements<bigint>;
        return assetGroup.assets.filter((x) => x.collectionId === 'BitBadges Lists' && x.mustOwnAmounts.start > 0n).map((x) => x.assetIds);
      })
      .flat()
      .flat() as string[];
  }, [assetOwnershipRequirements]);

  const mustNotBeOnLists = useMemo(() => {
    return (assetOwnershipRequirements as AndGroup<bigint>).$and
      .map((x) => {
        const assetGroup = x as OwnershipRequirements<bigint>;
        return assetGroup.assets.filter((x) => x.collectionId === 'BitBadges Lists' && x.mustOwnAmounts.start === 0n).map((x) => x.assetIds);
      })
      .flat()
      .flat() as string[];
  }, [assetOwnershipRequirements]);

  useEffect(() => {
    async function fetchLists() {
      const idsToFetch = [];
      for (const listId of [...mustBeOnLists, ...mustNotBeOnLists]) {
        if (!lists.find((x) => x.listId === listId)) {
          idsToFetch.push(listId);
        }
      }
      if (idsToFetch.length === 0) return;

      const res = await getAddressLists({ listsToFetch: idsToFetch.map((x) => ({ listId: x })) });
      setLists((lists) => [...lists, ...res.addressLists]);
    }

    fetchLists();
  }, [mustBeOnLists, mustNotBeOnLists]);

  const selectedLists = [...mustBeOnLists, ...mustNotBeOnLists];

  const [chainTab, setChainTab] = useState<string>('Ethereum');
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [amountRange, setAmountRange] = useState<UintRange<bigint>>(new UintRange({ start: 1n, end: 1n }));

  useEffect(() => {
    if (tab === 'other') {
      setAssetOwnershipRequirements({
        $and: [
          {
            assets: [
              {
                assetIds: [tokenId],
                collectionId: tokenAddress,
                mustOwnAmounts: amountRange,
                chain: chainTab,
                ownershipTimes: []
              }
            ],
            options: {
              numMatchesForVerification: 1n
            }
          }
        ]
      });
    } else {
      setAssetOwnershipRequirements({ $and: [] });
    }
  }, [tokenAddress, tokenId, amountRange, chainTab, tab]);

  return (
    <div className="primary-text full-width">
      <br />
      <Tabs
        fullWidth
        tab={tab}
        setTab={setTab}
        tabInfo={[
          {
            key: 'badges',
            content: 'Badges'
          },
          {
            key: 'lists',
            content: 'Lists'
          },
          {
            key: 'other',
            content: 'Other'
          }
        ]}
        type="underline"
      />
      {tab === 'other' && (
        <>
          <div className=" full-width">
            <InformationDisplayCard
              md={24}
              xs={24}
              sm={24}
              title="Ethereum NFTs"
              subtitle="Note that only Ethereum users will be able to satisfy this requirement.">
              <br />
              <RadioGroup
                label=""
                value={chainTab}
                options={[
                  {
                    label: 'Ethereum',
                    value: 'Ethereum'
                  },
                  {
                    label: 'Polygon',
                    value: 'Polygon'
                  }
                ]}
                onChange={setChainTab}
              />

              <Form colon={false} layout="vertical">
                <br />
                <GenericTextFormInput
                  label="Contract Address"
                  value={tokenAddress}
                  setValue={setTokenAddress}
                  helper="The address of the token contract."
                />
                <GenericTextFormInput label="Token ID" value={tokenId} setValue={setTokenId} helper="The ID of the token." />
                <div className="flex-center flex-wrap primary-text">
                  <div className="mx-4">
                    <NumberInput
                      title="Min Amount"
                      value={Number(amountRange.start)}
                      setValue={(x) => setAmountRange(new UintRange({ start: BigInt(x), end: amountRange.end }))}
                      min={0}
                    />
                  </div>
                  <div className="mx-4">
                    <NumberInput
                      title="Max Amount"
                      value={Number(amountRange.end)}
                      setValue={(x) => setAmountRange(new UintRange({ start: amountRange.start, end: BigInt(x) }))}
                      min={0}
                    />
                  </div>
                </div>
              </Form>
            </InformationDisplayCard>
          </div>
        </>
      )}

      {tab === 'badges' && (
        <>
          <br />
          <BalanceInput
            fullWidthCards
            isMustOwnBadgesInput
            message="Badge Requirements"
            hideMessage
            timeString="Authentication Time"
            balancesToShow={BalanceArray.From(
              (assetOwnershipRequirements as AndGroup<bigint>)?.$and
                .map((item) => {
                  const assetGroup = item as OwnershipRequirements<bigint>;

                  return (
                    assetGroup.assets.map((x) => {
                      const badgeIds = new UintRangeArray<bigint>();
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
                        ownershipTimes: UintRangeArray.FullRanges(),
                        mustSatisfyForAllAssets: true
                      };
                    }) ?? []
                  );
                })
                .flat() ?? []
            )}
            mustOwnBadges={(
              (assetOwnershipRequirements as AndGroup<bigint>)?.$and
                .map((item) => {
                  const assetGroup = item as OwnershipRequirements<bigint>;

                  return (
                    assetGroup.assets
                      .filter((x) => x.collectionId !== 'BitBadges Lists')
                      .map((x) => {
                        const badgeIds = [];
                        for (const asset of x.assetIds) {
                          if (typeof asset !== 'string') {
                            badgeIds.push(asset);
                          }
                        }
                        return {
                          collectionId: BigInt(x.collectionId),
                          overrideWithCurrentTime: (x.ownershipTimes ?? []).length === 0,
                          amountRange: x.mustOwnAmounts,
                          badgeIds: badgeIds,
                          ownershipTimes: x.ownershipTimes ?? [],
                          mustSatisfyForAllAssets:
                            !assetGroup.options?.numMatchesForVerification || assetGroup.options?.numMatchesForVerification === 0n
                        };
                      }) ?? []
                  );
                })
                .flat() ?? []
            ).map((x) => new MustOwnBadges(x))}
            onAddBadges={(balance, amountRange, collectionId, mustSatisfyForAllAssets, overrideWithCurrentTime) => {
              if (!collectionId || !amountRange) return;

              const currAssets = assetOwnershipRequirements as AndGroup<bigint>;
              currAssets.$and.push({
                assets: [
                  {
                    assetIds: balance.badgeIds,
                    collectionId: collectionId,
                    mustOwnAmounts: amountRange,
                    chain: 'BitBadges',
                    ownershipTimes: overrideWithCurrentTime ? [] : balance.ownershipTimes
                  }
                ],
                options: {
                  numMatchesForVerification: mustSatisfyForAllAssets ? undefined : 1n
                }
              });

              setAssetOwnershipRequirements({
                ...assetOwnershipRequirements,
                $and: currAssets.$and
              });
            }}
            onRemoveAll={() => {
              setAssetOwnershipRequirements({
                ...assetOwnershipRequirements,
                $and: []
              });
            }}
            // setBalances={setBalances}
            collectionId={0n}
          />
        </>
      )}
      {tab == 'lists' && (
        <>
          <CustomizeAddRemoveListFromPage
            span={24}
            addressOrUsername={chain.address}
            currItems={selectedLists}
            showIncludeExclude
            onAdd={async (listId, onList) => {
              if (selectedLists.includes(listId)) return;

              const res = await getAddressLists({ listsToFetch: [{ listId }] });
              const list = res.addressLists[0];
              if (!list) return;

              setLists([...lists, list]);

              const currAssets = assetOwnershipRequirements as AndGroup<bigint>;

              currAssets.$and.push({
                assets: [
                  {
                    assetIds: [listId],
                    collectionId: 'BitBadges Lists',
                    mustOwnAmounts: { start: onList ? 1n : 0n, end: onList ? 1n : 0n },
                    chain: 'BitBadges',
                    ownershipTimes: UintRangeArray.FullRanges()
                  }
                ],
                options: {
                  numMatchesForVerification: undefined //must satisfy all
                }
              });

              setAssetOwnershipRequirements({
                ...assetOwnershipRequirements,
                $and: currAssets.$and
              });
            }}
            onRemove={async (listId) => {
              setAssetOwnershipRequirements({
                ...assetOwnershipRequirements,
                $and: (assetOwnershipRequirements as AndGroup<bigint>).$and.filter((x) => {
                  const assetGroup = x as OwnershipRequirements<bigint>;
                  return assetGroup.assets.filter((y) => y.assetIds.includes(listId)).length === 0;
                })
              });
            }}
          />
          <ListInfiniteScroll
            hasMore={false}
            fetchMore={async () => {}}
            listsView={selectedLists.map((x) => lists.find((y) => y.listId === x)).filter((x) => !!x) as Array<BitBadgesAddressList<bigint>>}
            addressOrUsername={''}
            showInclusionDisplay={false}
            mustBeOnLists={mustBeOnLists}
            mustNotBeOnLists={mustNotBeOnLists}
          />
        </>
      )}
    </div>
  );
};

export default BlockinCodesScreen;
