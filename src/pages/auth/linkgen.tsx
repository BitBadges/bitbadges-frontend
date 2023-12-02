import { DownOutlined, InfoCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Select, Space, Tooltip, Typography, Upload, UploadProps, message } from 'antd';
import { useState } from 'react';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { CodeGenQueryParams } from './codegen';
import { DateRangeInput } from '../../components/inputs/DateRangeInput';
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
        await file2Base64(info.file.originFileObj as File).then((base64) => {

          setCodeGenParams({ ...codeGenParams, image: base64 });
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
          <div className='flex'>
            <InformationDisplayCard title='Enter Details' md={24} xs={24} sm={24} >
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
                  <div className='flex-between' style={{}}>
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
                  <Input
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
                      Start Time <Tooltip color='black' title={'The earliest time that the code can be used.'}>
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Text>
                  }
                >
                  <div className='flex-between' style={{}}>
                    <div className='primary-text inherit-bg full-width'>
                      <div className='primary-text'>
                        None?
                        <Checkbox
                          checked={!codeGenParams.challengeParams.notBefore}
                          style={{ marginLeft: 5 }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: '' } });
                            } else {
                              const maxDate = new Date();
                              maxDate.setFullYear(9999);
                              maxDate.setMonth(11);
                              maxDate.setDate(31);
                              maxDate.setHours(0);
                              maxDate.setMinutes(0);
                              maxDate.setSeconds(0);

                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: maxDate.toISOString() } });

                            }

                          }}
                        />

                      </div>

                      {codeGenParams.challengeParams.notBefore && <>
                        <DateRangeInput
                          timeRanges={[]}
                          setTimeRanges={(timeRanges) => {
                            setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, notBefore: timeRanges[0].start.toString() } });
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
                      End Time <Tooltip color='black' title={'The latest time that the code can be used.'}>
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Text>
                  }
                >
                  <div className='flex-between' style={{}}>
                    <div className='primary-text inherit-bg full-width'>
                      <div className='primary-text'>
                        None?
                        <Checkbox
                          checked={!codeGenParams.challengeParams.expirationDate}
                          style={{ marginLeft: 5 }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: '' } });
                            } else {
                              const maxDate = new Date();
                              maxDate.setFullYear(9999);
                              maxDate.setMonth(11);
                              maxDate.setDate(31);
                              maxDate.setHours(0);
                              maxDate.setMinutes(0);
                              maxDate.setSeconds(0);

                              setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: maxDate.toISOString() } });

                            }

                          }}
                        />

                      </div>

                      {codeGenParams.challengeParams.expirationDate && <>
                        <DateRangeInput
                          timeRanges={[]}
                          setTimeRanges={(timeRanges) => {
                            setCodeGenParams({ ...codeGenParams, challengeParams: { ...codeGenParams.challengeParams, expirationDate: timeRanges[0].start.toString() } });
                          }}
                        />
                      </>
                      }
                    </div>

                  </div>
                </Form.Item>

                
              </Form>
            </InformationDisplayCard>
          </div>
          <div
            className='inherit-bg primary-text'
            style={{
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            <Tooltip title={url}>
              <Typography.Text className='primary-text' copyable={{ text: url }} style={{ fontSize: 20 }}>
                Generated URL

              </Typography.Text>
            </Tooltip>
          </div>
          <div className='secondary-text'>
            <InfoCircleOutlined /> This is the URL that is to be shared with your users to generate a QR code.
            Navigate to the link and generate a QR code yourself to make sure it works and everything looks good.
          </div>

        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
