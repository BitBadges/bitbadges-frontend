import { DeleteOutlined, GithubOutlined, GoogleOutlined, LinkOutlined, MinusOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Checkbox, DatePicker, Form, Tooltip } from 'antd';
import { ClaimApiCallInfo, ClaimIntegrationPublicParamsType, JsonBodyInputSchema, JsonBodyInputWithValue } from 'bitbadgesjs-sdk';
import moment from 'moment';
import { ReactNode, useMemo, useState } from 'react';
import { DevMode } from '../components/common/DevMode';
import { ErrDisplay } from '../components/common/ErrDisplay';
import IconButton from '../components/display/IconButton';
import { NumberInput } from '../components/inputs/NumberInput';
import { Tabs } from '../components/navigation/Tabs';
import {
  AttributesSelect,
  FormInputLabel,
  GenericCheckboxFormInput,
  GenericTextAreaFormInput,
  GenericTextFormInput
} from '../components/tx-timelines/form-items/MetadataForm';
import { ClaimIntegrationPlugin } from './integrations';

const JSONBodyInputWithValueSelect = ({
  value,
  setValue,
  title,
  subtitle
}: {
  title?: string;
  subtitle?: string;
  value: JsonBodyInputWithValue[];
  setValue: (val: JsonBodyInputWithValue[]) => void;
}) => {
  const wrappedValue = value.map((x) => {
    return { ...x, name: x.key };
  });

  const setWrappedValue = (val: any[]) => {
    setValue(
      val.map((x) => ({
        key: x.name,
        label: x.label ?? '',
        type: x.type ?? typeof x.value,
        value: x.value
      }))
    );
  };

  return <AttributesSelect attributes={wrappedValue} setAttributes={setWrappedValue} title={title} subtitle={subtitle} />;
};

const JSONBodyInputSchemaSelect = ({
  value,
  setValue,
  title,
  subtitle
}: {
  title?: string;

  subtitle?: string;
  value: JsonBodyInputSchema[];
  setValue: (val: JsonBodyInputSchema[]) => void;
}) => {
  const [attributes, setAttributes] = useState<Array<{ name: string; value: string | number | boolean; type?: 'date' | 'url' | undefined }>>(
    value.map((x) => {
      const type = x.type === 'date' || x.type === 'url' ? x.type : undefined;

      return { name: x.key, value: '', type };
    })
  );

  return (
    <AttributesSelect
      attributes={attributes}
      setAttributes={(inputs) => {
        setAttributes(inputs);
        setValue(
          inputs.map((x) => ({
            key: x.name,
            label: x.label ?? '',
            helper: x.helper ?? '',
            type: x.type ?? (typeof x.value as 'string' | 'number' | 'boolean')
          }))
        );
      }}
      noValues
      subtitle={subtitle}
      title={title}
      showLabelSelect
    />
  );
};

const ApiQueryInputForm = ({ schema, setBody, body }: { schema: JsonBodyInputSchema[]; setBody: (body: any) => void; body: any }) => {
  const now = useMemo(() => Date.now(), []);

  return (
    <Form layout="vertical" className="mt-3 primary-text">
      {schema.map((x, i) => {
        if (x.type === 'string' || x.type === 'url') {
          return (
            <GenericTextFormInput
              key={i}
              value={(body[x.key] as string) ?? ''}
              setValue={(val) => setBody({ ...body, [x.key]: val })}
              label={x.label}
              helper={x.helper}
            />
          );
        } else if (x.type === 'number') {
          return (
            <>
              <div className="flex-center" key={i}>
                <NumberInput value={(body[x.key] as number) ?? 0} setValue={(val) => setBody({ ...body, [x.key]: val })} title={x.label} min={0} />
              </div>
              <div className="secondary-text">{x.helper}</div>
            </>
          );
        } else if (x.type === 'date') {
          return (
            <Form.Item label={<FormInputLabel label={x.label} />} key={i}>
              <DatePicker
                value={moment(new Date(Number((body[x.key] as number) ?? now)))}
                onChange={(e) => {
                  if (!e) return;
                  setBody({ ...body, [x.key]: new Date(e?.toISOString() ?? '').valueOf() ?? 0 });
                }}
                className="primary-text inherit-bg w-full"
              />
              <div className="secondary-text">{x.helper}</div>
            </Form.Item>
          );
        } else if (x.type === 'boolean') {
          return (
            <GenericCheckboxFormInput
              key={i}
              value={body[x.key] as boolean}
              setValue={(val) => setBody({ ...body, [x.key]: !!val })}
              label={x.label}
              helper={x.helper}
            />
          );
        }
      })}
    </Form>
  );
};
export const ApiPluginMetadataDisplay = ({
  name,
  image,
  description,
  uri,
  passDiscord,
  passTwitter,
  passGithub,
  passGoogle,
  passAddress
}: {
  uri: string;
  name: string;
  image: string | ReactNode;
  description: string | ReactNode;
  passGithub?: boolean;
  passDiscord?: boolean;
  passTwitter?: boolean;
  passGoogle?: boolean;
  passAddress?: boolean;
}) => {
  return (
    <div className="flex">
      <div style={{ alignItems: 'normal' }} className="flex">
        {typeof image === 'string' ? (
          <img src={image || '/images/bitbadgeslogo.png'} style={{ width: 40, height: 40 }} />
        ) : (
          <Avatar size={40} src={image} />
        )}
      </div>
      <div>
        <div className="flex flex-wrap">
          <b>{name} </b>
          <a href={uri} target="_blank">
            <Tooltip title={uri}>
              <LinkOutlined className="ml-1" />
            </Tooltip>
          </a>
          <div className="flex" style={{ alignItems: 'center' }}>
            {passAddress && (
              <Tooltip title="Passes your address to this query">
                <UserOutlined className="ml-1" />
              </Tooltip>
            )}
            {passDiscord && (
              <Tooltip title="Passes Discord username to this query">
                <svg className="ml-1" fill="#1890ff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height="15" style={{}}>
                  <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
                </svg>
              </Tooltip>
            )}
            {passTwitter && (
              <Tooltip title="Passes Twitter username to this quey">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 1200 1227"
                  fill="#1890ff"
                  x="0px"
                  y="0px"
                  className="ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: '10px' }}>
                  <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
                </svg>
              </Tooltip>
            )}
            {passGithub && <GithubOutlined className="ml-1" />}
            {passGoogle && <GoogleOutlined className="ml-1" />}
          </div>
        </div>
        <div
          className="secondary-text "
          style={{
            textAlign: 'left'
          }}>
          {description}
        </div>
      </div>
    </div>
  );
};

const ApiPluginCreateNode = ({
  publicParams,
  setParams,
  type
}: {
  type: 'balances' | 'list' | 'nonIndexed';
  publicParams: ClaimIntegrationPublicParamsType<'api'>;
  setParams: (params: ClaimIntegrationPublicParamsType<'api'>, state: {}) => void;
}) => {
  const apiCalls = publicParams.apiCalls;

  const [addIsVisible, setAddIsVisible] = useState(false);
  const [tab, setTab] = useState('templates');

  const [hardcodedInputs, setHardcodedInputs] = useState<JsonBodyInputWithValue[]>([]);
  const [apiCall, setApiCall] = useState<ClaimApiCallInfo>({
    name: '',
    uri: '',
    description: '',
    passAddress: true,
    passDiscord: false,
    passTwitter: false,
    passGithub: false,
    passGoogle: false,
    bodyParams: {},
    userInputsSchema: []
  });

  const toJsonObject = (arr: JsonBodyInputWithValue[]) => {
    const obj: { [key: string]: string | number | boolean } = {};
    for (const x of arr) {
      obj[x.key] = x.value;
    }
    return obj;
  };

  return (
    <>
      {apiCalls.map((x, i) => {
        const plugin = ApiCallPlugins.find((y) => y.metadata.name === x.name);

        return (
          <>
            <div key={i} className="flex flex-between">
              <ApiPluginMetadataDisplay
                name={x.name}
                image={ApiCallPlugins.find((y) => y.metadata.name === x.name)?.metadata.image ?? ''}
                description={
                  <>
                    {x.description ?? ''}
                    <br />
                    {plugin &&
                      plugin?.detailsString?.({
                        uri: x.uri,
                        passAddress: x.passAddress ?? false,
                        passDiscord: x.passDiscord ?? false,
                        passTwitter: x.passTwitter ?? false,
                        passGoogle: x.passGoogle ?? false,
                        passGithub: x.passGithub ?? false,
                        userInputsSchema: x.userInputsSchema,
                        name: x.name,
                        bodyParams: x.bodyParams
                      })}
                  </>
                }
                uri={x.uri}
                passDiscord={x.passDiscord}
                passTwitter={x.passTwitter}
                passGithub={x.passGithub}
                passGoogle={x.passGoogle}
                passAddress={x.passAddress}
              />

              <div className="flex-center">
                <IconButton
                  src={<DeleteOutlined />}
                  onClick={() => {
                    setParams(
                      {
                        apiCalls: publicParams.apiCalls.filter((_, idx) => idx !== i)
                      },
                      {}
                    );
                  }}
                  text="Remove"
                />
              </div>
            </div>
          </>
        );
      })}
      <div className="flex-center">
        <IconButton
          src={addIsVisible ? <MinusOutlined /> : <PlusOutlined />}
          onClick={() => {
            setAddIsVisible(!addIsVisible);
          }}
          text={addIsVisible ? 'Hide' : 'Add'}
        />
      </div>
      {addIsVisible && (
        <>
          <div className="mb-2 flex-center">
            <Tabs
              tab={tab}
              setTab={setTab}
              tabInfo={[
                { key: 'templates', content: 'Browse' },
                { key: 'custom', content: 'Custom' }
              ]}
              type="underline"
            />
          </div>
          {tab === 'templates' && (
            <>
              {ApiCallPlugins.map((x) => {
                if (type === 'nonIndexed' && x.metadata.nonIndexedCompatible === false) return null;

                return (
                  <div key={x.id} className="mb-4">
                    <div className="flex flex-between">
                      <ApiPluginMetadataDisplay
                        name={x.metadata.name}
                        image={x.metadata.image}
                        description={x.metadata.description}
                        uri={x.apiCallInfo.uri}
                        passDiscord={x.apiCallInfo.passDiscord}
                        passTwitter={x.apiCallInfo.passTwitter}
                        passGithub={x.apiCallInfo.passGithub}
                        passGoogle={x.apiCallInfo.passGoogle}
                        passAddress={x.apiCallInfo.passAddress}
                      />
                      <Checkbox
                        checked={apiCall.name === x.metadata.name}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiCall({
                              name: x.metadata.name,
                              uri: x.apiCallInfo.uri,
                              description: x.metadata.description,
                              passDiscord: x.apiCallInfo.passDiscord,
                              passTwitter: x.apiCallInfo.passTwitter,
                              passAddress: x.apiCallInfo.passAddress,
                              passGoogle: x.apiCallInfo.passGoogle,
                              passGithub: x.apiCallInfo.passGithub,
                              bodyParams: toJsonObject(x.apiCallInfo.hardcodedInputs),
                              userInputsSchema: x.apiCallInfo.userInputsSchema
                            });
                          } else {
                            setApiCall({
                              name: '',
                              uri: '',
                              description: '',
                              passAddress: true,
                              passDiscord: false,
                              passGithub: false,
                              passTwitter: false,
                              passGoogle: false,
                              bodyParams: {},
                              userInputsSchema: []
                            });
                          }
                        }}
                      />
                    </div>
                    {apiCall.name === x.metadata.name && (
                      <ApiQueryInputForm
                        schema={x.apiCallInfo.creatorInputsSchema}
                        setBody={(body) => {
                          setApiCall({
                            name: x.metadata.name,
                            uri: x.apiCallInfo.uri,
                            description: x.metadata.description,
                            passDiscord: x.apiCallInfo.passDiscord,
                            passAddress: x.apiCallInfo.passAddress,
                            passGithub: x.apiCallInfo.passGithub,
                            passGoogle: x.apiCallInfo.passGoogle,
                            passTwitter: x.apiCallInfo.passTwitter,
                            bodyParams: {
                              ...toJsonObject(x.apiCallInfo.hardcodedInputs),
                              ...body
                            },
                            userInputsSchema: x.apiCallInfo.userInputsSchema
                          });
                        }}
                        body={apiCall.bodyParams ?? {}}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {tab === 'custom' && (
            <>
              {' '}
              <div className="secondary-text text-center mt-4">
                Make a custom POST HTTP request to a URI of your choice. See{' '}
                <a href="https://docs.bitbadges.io/overview/claim-builder/api-calls" target="_blank">
                  documentation
                </a>{' '}
                for more information.
              </div>
              <Form layout="vertical" className="mt-3">
                <GenericTextFormInput required value={apiCall.uri} setValue={(val) => setApiCall({ ...apiCall, uri: val })} label="URI" />
                <GenericTextFormInput required value={apiCall.name} setValue={(val) => setApiCall({ ...apiCall, name: val })} label="Name" />
                <GenericTextAreaFormInput
                  value={apiCall.description ?? ''}
                  setValue={(val) => setApiCall({ ...apiCall, description: val })}
                  label="Description"
                />
                <GenericCheckboxFormInput
                  value={apiCall.passAddress ?? false}
                  setValue={(val) => setApiCall({ ...apiCall, passAddress: !!val })}
                  label="Pass user web3 address?"
                  helper="This determines whether the URI expects to receive the user's address."
                />
                <GenericCheckboxFormInput
                  value={apiCall.passDiscord ?? false}
                  setValue={(val) => setApiCall({ ...apiCall, passDiscord: !!val })}
                  label="Pass user Discord data?"
                  helper="This determines whether the URI expects to receive the user's Discord username."
                />
                <GenericCheckboxFormInput
                  value={apiCall.passTwitter ?? false}
                  setValue={(val) => setApiCall({ ...apiCall, passTwitter: !!val })}
                  label="Pass user Twitter data?"
                  helper="This determines whether the URI expects to receive the user's Twitter username."
                />
                <GenericCheckboxFormInput
                  value={apiCall.passGithub ?? false}
                  setValue={(val) => setApiCall({ ...apiCall, passGithub: !!val })}
                  label="Pass user Github data?"
                  helper="This determines whether the URI expects to receive the user's Github username."
                />
                <GenericCheckboxFormInput
                  value={apiCall.passGoogle ?? false}
                  setValue={(val) => setApiCall({ ...apiCall, passGoogle: !!val })}
                  label="Pass user Google data?"
                  helper="This determines whether the URI expects to receive the user's Google username."
                />
                <JSONBodyInputWithValueSelect
                  value={hardcodedInputs}
                  setValue={(inputs) => {
                    setHardcodedInputs(inputs);
                    setApiCall({
                      ...apiCall,
                      bodyParams: toJsonObject(inputs)
                    });
                  }}
                  title="Hardcoded Params"
                  subtitle="These parameters will be hardcoded into every API call's body."
                />

                <JSONBodyInputSchemaSelect
                  value={apiCall.userInputsSchema}
                  setValue={(inputs) => {
                    setApiCall({
                      ...apiCall,
                      userInputsSchema: inputs
                    });
                  }}
                  title="User Inputs"
                  subtitle="These parameters will be asked of the user when they make a claim."
                />
                {apiCall.userInputsSchema.length > 0 && (
                  <>
                    <div className="flex primary-text">
                      <b>Example User Form</b>
                    </div>
                    <ApiQueryInputForm
                      schema={apiCall.userInputsSchema}
                      setBody={(body) => {
                        setApiCall({
                          ...apiCall,
                          bodyParams: {
                            ...apiCall.bodyParams,
                            ...body
                          }
                        });
                      }}
                      body={apiCall.bodyParams ?? {}}
                    />
                  </>
                )}

                <div>
                  <b className="text-center primary-text">
                    Example Body
                    <br />
                  </b>
                  {[
                    'cosmosAddress',
                    'claimId',
                    ...(apiCall.passGithub ? ['github'] : []),
                    ...(apiCall.passDiscord ? ['discord'] : []),
                    ...(apiCall.passTwitter ? ['twitter'] : []),
                    ...(apiCall.passGoogle ? ['google'] : [])
                  ].some((x: string) => {
                    return !!(apiCall.bodyParams as any)?.[x] || apiCall.userInputsSchema.find((y) => y.key === x);
                  }) && <ErrDisplay err={'Do not use reserved keys. Your custom values will be overwritten.'} />}
                  <DevMode
                    override
                    obj={{
                      claimId: 'abcxyz123',
                      cosmosAddress: apiCall.passAddress ? 'cosmos1...' : '',
                      discord: apiCall.passDiscord
                        ? {
                            id: '...',
                            username: '...',
                            discriminator: '...'
                          }
                        : undefined,
                      twitter: apiCall.passTwitter
                        ? {
                            id: '...',
                            username: '...'
                          }
                        : undefined,
                      ...apiCall.bodyParams,
                      ...apiCall.userInputsSchema.reduce((acc, x) => {
                        acc[x.key] = x.type === 'string' ? '...' : x.type === 'number' ? 1234 : true;
                        return acc;
                      }, {} as any),
                      github: apiCall.passGithub
                        ? {
                            id: '...',
                            username: '...'
                          }
                        : undefined,
                      google: apiCall.passGoogle
                        ? {
                            id: '...',
                            username: '...'
                          }
                        : undefined
                    }}
                  />
                </div>
              </Form>
            </>
          )}

          <br />
          <button
            className="w-full landing-button"
            disabled={!apiCall.name || !apiCall.uri}
            onClick={() => {
              setParams(
                {
                  apiCalls: [...publicParams.apiCalls, apiCall]
                },
                {}
              );
              setApiCall({
                name: '',
                uri: '',
                description: '',
                passAddress: true,
                passDiscord: false,
                passGithub: false,
                passGoogle: false,
                passTwitter: false,
                bodyParams: {},
                userInputsSchema: []
              });
              setAddIsVisible(false);
            }}>
            Add
          </button>
        </>
      )}
    </>
  );
};

export const ApiPluginDetails: ClaimIntegrationPlugin<'api'> = {
  id: 'api',
  metadata: {
    name: 'Custom Queries',
    description: 'Gate the claim with custom calls to external, third-party tools.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => '',
  inputNode: ({ publicParams, setCustomBody, customBody }) => {
    console.log(customBody);
    return (
      <>
        {publicParams.apiCalls.map((x, i) => {
          return (
            <div key={i}>
              <ApiPluginMetadataDisplay
                name={x.name}
                image={ApiCallPlugins.find((y) => y.metadata.name === x.name)?.metadata.image ?? ''}
                description={
                  <>
                    {x.description ?? ''}
                    <br />
                    {ApiCallPlugins.find((y) => y.metadata.name === x.name)?.detailsString?.({
                      uri: x.uri,
                      passAddress: x.passAddress ?? false,
                      passDiscord: x.passDiscord ?? false,
                      passTwitter: x.passTwitter ?? false,
                      passGoogle: x.passGoogle ?? false,
                      passGithub: x.passGithub ?? false,
                      userInputsSchema: x.userInputsSchema,
                      name: x.name,
                      bodyParams: x.bodyParams
                    })}
                  </>
                }
                uri={x.uri}
                passDiscord={x.passDiscord}
                passTwitter={x.passTwitter}
                passGithub={x.passGithub}
                passGoogle={x.passGoogle}
                passAddress={x.passAddress}
              />

              <ApiQueryInputForm
                schema={x.userInputsSchema}
                setBody={(body) => {
                  const newBody = [];
                  for (let idx = 0; idx < publicParams.apiCalls.length; idx++) {
                    if (idx === i) {
                      newBody.push(body);
                    } else {
                      newBody.push((customBody as object[])?.[i] ?? {});
                    }
                  }
                  setCustomBody(newBody);
                }}
                body={((customBody as object[])?.[i] ?? {}) as any}
              />
            </div>
          );
        })}
      </>
    );
  },
  createNode({ publicParams, setParams, type }) {
    return <ApiPluginCreateNode publicParams={publicParams} setParams={setParams} type={type} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'api'> }) => {
    return (
      <>
        Must pass custom validation checks:{' '}
        {publicParams.apiCalls.map((x, i) => {
          return (
            <>
              <span key={i}>
                {i > 0 ? ', ' : ''}
                <Tooltip
                  title={
                    <div className="text-center">
                      {x.description}
                      {(x.passDiscord || x.passTwitter || x.passGithub || x.passGoogle || x.passAddress) && (
                        <>
                          <br />
                          <br />
                          *Will pass{' '}
                          {[
                            x.passAddress ? 'address' : '',
                            x.passDiscord ? 'Discord' : '',
                            x.passTwitter ? 'Twitter' : '',
                            x.passGithub ? 'Github' : '',
                            x.passGoogle ? 'Google' : ''
                          ]
                            .filter((x) => x)
                            .join(', ')}
                          data to this API.
                        </>
                      )}
                    </div>
                  }>
                  {x.name}
                </Tooltip>
                <Tooltip title={x.uri}>
                  <LinkOutlined className="pl-1" />
                </Tooltip>
              </span>
            </>
          );
        })}
      </>
    );
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return {
      apiCalls: []
    };
  },
  getBlankPublicState() {
    return {};
  }
};

export const ApiCallPlugins: ApiCallPlugin[] = [
  {
    id: 'github-contributions',
    metadata: {
      name: 'Github Contributions',
      description: "Check a user's Github contributions.",
      image: <Avatar size={40} src={<GithubOutlined style={{ fontSize: 30 }} />} />,
      createdBy: 'BitBadges',
      nonIndexedCompatible: false
    },
    apiCallInfo: {
      uri: 'https://api.bitbadges.io/api/v0/integrations/query/github-contributions',
      passDiscord: false,
      passTwitter: false,
      passAddress: false,
      passGoogle: false,
      passGithub: true,
      userInputsSchema: [],
      creatorInputsSchema: [{ key: 'repository', label: 'Repository', type: 'string', helper: 'Ex: bitbadges/bitbadges-frontend' }],
      hardcodedInputs: []
    },
    detailsString: (apiCall) => {
      return (
        <div>
          <div className="">
            <b>Repository:</b> {apiCall.bodyParams?.repository}
          </div>
        </div>
      );
    }
  },
  {
    id: 'min-badge',
    metadata: {
      name: 'Min $BADGE',
      description: 'Users must have a minimum balance of $BADGE.',
      image: 'https://avatars.githubusercontent.com/u/86890740',
      createdBy: 'BitBadges',
      nonIndexedCompatible: true
    },
    apiCallInfo: {
      uri: 'https://api.bitbadges.io/api/v0/integrations/query/min-badge',
      passDiscord: false,
      passTwitter: false,
      passAddress: true,
      passGoogle: false,
      passGithub: false,
      userInputsSchema: [],
      creatorInputsSchema: [{ key: 'minBalance', label: 'Minimum Balance', type: 'number' }],
      hardcodedInputs: []
    },
    detailsString: (apiCall) => {
      return (
        <div>
          <div className="">
            <b>Minimum $BADGE Balance:</b> {apiCall.bodyParams?.minBalance}
          </div>
        </div>
      );
    }
  }
];

export interface ApiCallPlugin {
  id: string;
  metadata: {
    name: string;
    description: string;
    image: string | ReactNode;
    createdBy: string;
    nonIndexedCompatible?: boolean;
  };
  apiCallInfo: {
    uri: string;
    passAddress: boolean;
    passDiscord: boolean;
    passTwitter: boolean;
    passGoogle: boolean;
    passGithub: boolean;
    userInputsSchema: Array<JsonBodyInputSchema>;
    creatorInputsSchema: Array<JsonBodyInputSchema>;
    hardcodedInputs: Array<JsonBodyInputWithValue>;
  };
  detailsString?: (apiCall: ClaimApiCallInfo) => ReactNode;
}
