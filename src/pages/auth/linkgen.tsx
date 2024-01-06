import { DownOutlined, InfoCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Form, Input, Select, Space, Tooltip, Typography, Upload, UploadProps, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { addMetadataToIpfs, fetchMetadataDirectly } from '../../bitbadges-api/api';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { BalanceInput } from '../../components/balances/BalanceInput';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { CodeGenQueryParams } from './codegen';
const { Text } = Typography;


function BlockinCodesScreen() {
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

  const sampleImages = [
    {
      value: 'ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o',
      label: 'BitBadges Logo',
    },
  ]


  const images = [
    ...sampleImages,
    codeGenParams.image && !sampleImages.find(x => x.value === codeGenParams.image)
      ? {
        value: codeGenParams.image,
        label: 'Custom Image',
      } : undefined
  ].filter(x => !!x);

  const [imageIsUploading, setImageIsUploading] = useState(false);

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };


  const props: UploadProps = {
    showUploadList: false,
    name: 'file',
    multiple: true,
    customRequest: dummyRequest,
    async onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      } else {
        if (!imageIsUploading) {
          message.info(`${info.file.name} file is uploading.`);
          setImageIsUploading(true);
        }
      }

      if (info.file.status === 'done') {
        await file2Base64(info.file.originFileObj as File).then(async (base64) => {
          //TODO: optimize
          const res = await addMetadataToIpfs({ collectionMetadata: { name: '', description: '', image: base64 } });
          const imageRes = res?.collectionMetadataResult?.cid;
          const getRes = await fetchMetadataDirectly({ uris: ['ipfs://' + imageRes] });
          const metadata = getRes.metadata[0];
          const image = metadata?.image;
          if (!image) {
            message.error(`${info.file.name} file upload failed.`);
            return;
          }

          setCodeGenParams({ ...codeGenParams, image: image });
          setImageIsUploading(false);
          message.success(`${info.file.name} file uploaded successfully.`);
        })
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      } else {

      }
    },
  };

  const file2Base64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString() || '');
      reader.onerror = error => reject(error);
    })
  }


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

                <Form.Item
                  label={
                    <Text
                      className='primary-text'
                      strong
                    >
                      Image
                    </Text>
                  }
                  required
                >
                  <div className='flex-between'>
                    <Select
                      className="selector primary-text inherit-bg"
                      value={images.find((item: any) => item.value === codeGenParams.image)?.label}
                      onChange={(e) => {
                        const newImage = images.find((item: any) => e === item.label)?.value;
                        if (newImage) {
                          setCodeGenParams({ ...codeGenParams, image: newImage });
                        }
                      }}
                      style={{
                      }}
                      suffixIcon={
                        <DownOutlined
                          className='primary-text'
                        />
                      }
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider />
                          <Space
                            align="center"
                            style={{ padding: '0 8px 4px' }}
                          >
                            <Upload {...props}>
                              <Button icon={<UploadOutlined />}>Click to Upload New Image(s)</Button>
                            </Upload>
                            or Enter URL
                            <Input
                              style={{ color: 'black' }}
                              value={codeGenParams.image}
                              onChange={(e) => {
                                setCodeGenParams({ ...codeGenParams, image: e.target.value });
                              }}
                              placeholder="Enter URL"
                            />
                          </Space>
                        </>
                      )}
                    >
                      {images.map((item: any) => (
                        <Select.Option
                          key={item.label}
                          value={item.label}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <img
                              src={item.value.replace('ipfs://', 'https://bitbadges-ipfs.infura-ipfs.io/ipfs/')}

                              style={{ paddingRight: 10, height: 20 }}
                              alt="Label"
                            />
                            <div>{item.label}</div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </Form.Item>

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
