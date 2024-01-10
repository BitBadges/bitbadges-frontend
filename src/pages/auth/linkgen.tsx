import { InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, DatePicker, Form, Input, Tooltip, Typography, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { BalanceInput } from '../../components/balances/BalanceInput';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { ImageSelect } from '../../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { CodeGenQueryParams } from './codegen';
import { addMetadataToIpfs, fetchMetadataDirectly } from '../../bitbadges-api/api';
const { Text } = Typography;

function BlockinCodesScreen() {
  const [image, setImage] = useState<string>('');
  const [codeGenParams, setCodeGenParams] = useState<Required<CodeGenQueryParams>>({
    name: "",
    description: "",
    image: "ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o",

    callbackRequired: false,
    generateNonce: true,
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
    }
  });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!codeGenParams.name || !codeGenParams.description) {
      setErrorMessage('Please provide a name and description');
    } else if (!codeGenParams.challengeParams.domain || !codeGenParams.challengeParams.statement) {
      setErrorMessage('Please provide a domain and statement');
    } else if (!codeGenParams.image) {
      setErrorMessage('Please provide an image');
    } else {
      setErrorMessage('');
    }
  }, [codeGenParams]);

  const FRONTEND_URL = "https://bitbadges.io"
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
            QR Code Authentication - Create a URL
          </div>
          <Divider />
          <div className='flex'>
            <InformationDisplayCard title='Details' md={12} xs={24} sm={24} subtitle='Provide details so we can generate the URL for you to send to your users.'>
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
                      setCodeGenParams({ ...codeGenParams, name: e.target.value });
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
                      setCodeGenParams({ ...codeGenParams, description: e.target.value });
                    }}
                    style={{
                    }}
                    className='primary-text inherit-bg'
                  />
                </Form.Item>

                <ImageSelect image={image} setImage={(image: string) => {
                  setImage(image);
                }} />

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
                </Form.Item>

                <Form.Item
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
                </Form.Item>

                <Form.Item
                  label={
                    <Text
                      className='primary-text'
                      strong
                    >
                      Not Before <Tooltip color='black' title={'The earliest time that the code can be used.'}>
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
                </Form.Item>

                <Form.Item
                  label={
                    <Text
                      className='primary-text'
                      strong
                    >
                      Expiration Time <Tooltip color='black' title={'The latest time that the code can be used.'}>
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
                          mustOwnAll: true
                        }
                      }) ?? []}
                      onAddBadges={(balance, amountRange, collectionId) => {
                        if (!collectionId || !amountRange) return;

                        const newAssets = codeGenParams.challengeParams.assets ? [...codeGenParams.challengeParams.assets] : [];
                        newAssets.push({
                          assetIds: balance.badgeIds,
                          collectionId: collectionId,
                          mustOwnAmounts: amountRange,
                          chain: 'BitBadges',
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


              </Form>
            </InformationDisplayCard>
            <InformationDisplayCard title='URL and Instructions' md={12} xs={24} sm={24} subtitle='Below is the URL that you will share with your users based on the details provided. When users navigate, they will be walked through the process of generating a QR code.'>
              {errorMessage ? <><Divider /><div style={{ color: 'red' }}>
                Error generating URL: {errorMessage}
              </div> </> : <></>}
              {!errorMessage && <>
                <div
                  className='inherit-bg primary-text'
                  style={{
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  <Tooltip title={url}>
                    <Typography.Text className='primary-text' copyable={{ text: url }} style={{ fontSize: 20 }}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url.split('?')[0]}?...{url.split('?')[1].slice(-10)}
                      </a>
                    </Typography.Text>
                  </Tooltip>
                </div>
                <Divider />
                <div className='flex-center'>
                  <b className='primary-text'>
                    Next Steps
                  </b>
                </div>
                <div className='secondary-text'>
                  1) Navigate to the link and generate a QR code yourself to make sure it works and everything looks good.
                </div>
                <br />
                <div className='secondary-text'>
                  2) Share the link with your users. They will be walked through the process of generating and storing a QR code.
                  It is strongly recommended that you also tell users to save the QR code elsewhere (in addition to their BitBadges account).
                  This is because signing in to BitBadges requires a wallet signature, and you should not expect users to have their crypto wallet on hand at all times.
                </div>
                <br />
                <div className='secondary-text'>
                  3) Users will present the QR code to you at authentication time. You can then scan the QR code to authenticate them using Blockin.
                  See here for <a href='https://docs.bitbadges.io/for-developers/generating-auth-qr-codes' target='_blank' rel="noopener noreferrer">more information on how to verify with Blockin</a>.
                  For simple use cases, consider using <a href="https://bitbadges.io/auth/verify" target="_blank" rel="noopener noreferrer">this tool</a> created by us to verify the QR code directly in your browser.


                </div>
              </>}
            </InformationDisplayCard>
          </ div>


        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
