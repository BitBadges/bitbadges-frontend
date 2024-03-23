import { GithubOutlined, GoogleOutlined, InfoCircleOutlined, MailOutlined, WarningOutlined } from '@ant-design/icons';
import { Form, Input, Spin, Switch, Tag } from 'antd';
import { ClaimIntegrationPrivateParamsType, ClaimIntegrationPublicParamsType } from 'bitbadgesjs-sdk';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { BitBadgesApi } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { useWeb2Context } from '../bitbadges-api/contexts/chains/Web2Context';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import { TableRow } from '../components/display/TableRow';
import { NumberInput } from '../components/inputs/NumberInput';
import { FormInputLabel, GenericTextAreaFormInput } from '../components/tx-timelines/form-items/MetadataForm';
import { BACKEND_URL } from '../constants';
import { ClaimIntegrationPlugin, getPlugin } from './integrations';

const GenericOAuthInputNode = <T extends { username: string }>({
  appName,
  appLogo
  // setDisabled
}: {
  appLogo: ReactNode;
  appName: string;
  setDisabled: (disabled: string) => void;
}) => {
  const [currUser, setCurrUser] = useState<T | undefined>(undefined);
  const [clicked, setClicked] = useState(false);

  const poll = useCallback(async () => {
    if (!currUser) {
      const user = await BitBadgesApi.checkIfSignedIn({});
      if (user[appName as keyof typeof user]) {
        setCurrUser(user[appName as keyof typeof user] as unknown as T);
      }
    }
  }, [currUser, appName]);

  useEffect(() => {
    if (!currUser) {
      poll();

      //Every 5 seconds
      const interval = setInterval(async () => {
        await poll();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
      {currUser?.username && (
        <>
          <div>Signed in as {currUser?.username}</div>
          <br />
          <br />
          <div className="flex-center">
            <button
              className="bg-black p-3 rounded-lg flex hover:bg-gray-800 "
              onClick={async () => {
                await BitBadgesApi.signOut({
                  signOutDiscord: false,
                  signOutBlockin: false,
                  signOutTwitter: false,
                  signOutGoogle: false,
                  signOutGithub: false,
                  ['signOut' + appName.charAt(0).toUpperCase() + appName.slice(1)]: true
                });
                setCurrUser(undefined);
                setClicked(false);
              }}>
              Sign Out
            </button>
          </div>
        </>
      )}
      {!currUser?.username && (
        <div className="flex-center">
          <button
            className="bg-black p-3 rounded-lg flex hover:bg-gray-800 "
            onClick={() => {
              setClicked(true);
              window.open(BACKEND_URL + `/auth/${appName}`, '_blank');
            }}>
            Sign In to {appName.charAt(0).toUpperCase() + appName.slice(1)}
            <div style={{ marginLeft: 10, marginRight: 10 }}>{appLogo}</div>
            {clicked && <Spin />}
          </button>
        </div>
      )}
    </>
  );
};

const TwitterInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
  return <GenericOAuthInputNode appName="twitter" appLogo={getPlugin('twitter').metadata.image} setDisabled={setDisabled} />;
};

type OauthAppName = 'twitter' | 'discord' | 'github' | 'google' | 'email';

const GenericOAuthCreateNode = <P extends OauthAppName>({
  publicParams,
  privateParams,
  setParams,
  noun = 'user',
  appName
}: {
  privateParams: ClaimIntegrationPrivateParamsType<P>;
  publicParams: ClaimIntegrationPublicParamsType<P>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<P>, privateParams: ClaimIntegrationPrivateParamsType<P>) => void;
  noun?: string;
  appName?: OauthAppName;
}) => {
  // const [privateValues, setPrivateValues] = useState<boolean>(!!privateParams.users?.length);
  const privateValues = true;
  const maxUsesPerUser = publicParams.maxUsesPerUser ?? 0;

  const usernames = useMemo(() => {
    if (privateValues) {
      return privateParams.users ?? [];
    }

    return publicParams.users ?? [];
  }, [publicParams.users, privateParams.users, privateValues]);

  const [inputStr, setInputStr] = useState(usernames?.join(', '));
  const [restrictToUsers, setRestrictToUsers] = useState<boolean>(!!usernames.length);

  const setUsers = (users: string[], maxPerUser: number, listUrl?: string, privateUsers?: boolean) => {
    if (privateUsers) {
      setParams(
        { listUrl, maxUsesPerUser: maxPerUser, hasPrivateList: users.length > 0 } as ClaimIntegrationPublicParamsType<P>,
        { users } as ClaimIntegrationPrivateParamsType<P>
      );
    } else {
      setParams(
        { users, listUrl, maxUsesPerUser: maxPerUser, hasPrivateList: false } as ClaimIntegrationPublicParamsType<P>,
        {} as ClaimIntegrationPrivateParamsType<P>
      );
    }
  };

  const listUrl = publicParams.listUrl;

  return (
    <div>
      <div className="mb-5 flex-center flex-column">
        <br />
        <TableRow
          customClass="mb-5"
          label={<>Limit per {noun}?</>}
          value={
            <div className="" style={{ float: 'right' }}>
              <div>
                <Switch
                  checked={!!maxUsesPerUser}
                  checkedChildren={`Limit to ${maxUsesPerUser} Uses`}
                  unCheckedChildren="No Limit"
                  onChange={(checked) => {
                    setUsers(usernames, checked ? 1 : 0, listUrl, privateValues);
                  }}
                  className="mb-2"
                />
              </div>

              {!!maxUsesPerUser && (
                <NumberInput
                  title=""
                  value={maxUsesPerUser}
                  setValue={(val) => {
                    setUsers(usernames, val, listUrl, privateValues);
                  }}
                  min={1}
                />
              )}
            </div>
          }
          labelSpan={12}
          valueSpan={12}
        />
        <TableRow
          customClass="mb-5"
          label={<>Restrict to specific {noun}s?</>}
          value={
            <div className="" style={{ float: 'right' }}>
              <div>
                <Switch
                  checked={restrictToUsers}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  onChange={(checked) => {
                    setRestrictToUsers(checked);
                    if (!checked) {
                      setUsers([], maxUsesPerUser, listUrl, privateValues);
                    }
                  }}
                  className="mb-2"
                />
              </div>
            </div>
          }
          labelSpan={12}
          valueSpan={12}
        />
        {restrictToUsers && (
          <>
            <div className="text-center secondary-text mb-10">
              The list will remain private by default, but you can host it publicly yourself, if desired.
            </div>
            <Form layout="vertical">
              <GenericTextAreaFormInput
                label="List Info"
                value={publicParams.listUrl ?? ''}
                setValue={(val) => {
                  setUsers(usernames, maxUsesPerUser, val, privateValues);
                }}
                placeholder=""
                helper="Provide details for how users can access the list (if public). Leave blank for private lists."
              />
              <Form.Item label={<FormInputLabel label={noun.charAt(0).toUpperCase() + noun.slice(1) + 's'} />}>
                <Input.TextArea
                  value={inputStr}
                  onChange={(e) => {
                    const names = e.target.value
                      .split(',')
                      .map((name) => name.trim())
                      .filter((name) => name)
                      .map((name) => (name.startsWith('@') ? name.slice(1) : name));
                    setInputStr(e.target.value);
                    setUsers(names, maxUsesPerUser, listUrl, privateValues);
                  }}
                  className="primary-text inherit-bg"
                />
                <div className="secondary-text">
                  <InfoCircleOutlined /> Separate {noun}s with a comma (abc, xyz). If none are provided, there will be no restriction.
                  {appName == 'discord' ? ' Discord discriminators are supported as xyz#1234.' : ''}
                </div>
                <br />
                {usernames.map((name) => {
                  const displayname = name;
                  return (
                    <Tag
                      key={name}
                      closable
                      onClose={() => {
                        setUsers(
                          usernames.filter((n) => n !== name),
                          maxUsesPerUser,
                          listUrl,
                          privateValues
                        );
                        setInputStr(usernames.filter((n) => n !== name).join(', '));
                      }}>
                      {displayname}
                    </Tag>
                  );
                })}
              </Form.Item>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

const TwitterCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'twitter'>;
  privateParams: ClaimIntegrationPrivateParamsType<'twitter'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'twitter'>, privateParams: ClaimIntegrationPrivateParamsType<'twitter'>) => void;
}) => {
  return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} />;
};

const GoogleCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'google'>;
  privateParams: ClaimIntegrationPrivateParamsType<'google'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'google'>, privateParams: ClaimIntegrationPrivateParamsType<'google'>) => void;
}) => {
  return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} />;
};

const GoogleInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
  return <GenericOAuthInputNode appName="google" appLogo={getPlugin('google').metadata.image} setDisabled={setDisabled} />;
};

const GithubCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'github'>;
  privateParams: ClaimIntegrationPrivateParamsType<'github'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'github'>, privateParams: ClaimIntegrationPrivateParamsType<'github'>) => void;
}) => {
  return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} />;
};

const GithubInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
  return <GenericOAuthInputNode appName="github" appLogo={getPlugin('github').metadata.image} setDisabled={setDisabled} />;
};

const EmailCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'email'>;
  privateParams: ClaimIntegrationPrivateParamsType<'email'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'email'>, privateParams: ClaimIntegrationPrivateParamsType<'email'>) => void;
}) => {
  return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} noun={'email'} />;
};

// const StripeCreateNode = ({
//   publicParams,
//   privateParams,
//   setParams
// }: {
//   publicParams: ClaimIntegrationPublicParamsType<'stripe'>;
//   privateParams: ClaimIntegrationPrivateParamsType<'stripe'>;
//   setParams: (publicParams: ClaimIntegrationPublicParamsType<'stripe'>, privateParams: ClaimIntegrationPrivateParamsType<'stripe'>) => void;
// }) => {
//   return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} />;
// };

// const StripeInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
//   return <GenericOAuthInputNode appName="stripe" appLogo={getPlugin('stripe').metadata.image} setDisabled={setDisabled} />;
// };

const ProofOfAddressInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
  const chain = useChainContext();

  useEffect(() => {
    setDisabled(chain?.loggedIn ? '' : 'Please sign in to claim.');
  }, [chain?.loggedIn]);

  return (
    <div className="flex-center flex-column">
      <BlockinDisplay />
    </div>
  );
};

export const DiscordInputNode = ({
  setDisabled,
  onSuccess
}: {
  onSuccess?: (username: string, id: string, discriminator?: string) => void;
  setDisabled: (disabled: string) => void;
}) => {
  const web2Context = useWeb2Context();
  const [currDiscordUser, setCurrDiscordUser] = useState<
    | {
        username: string;
        discriminator: string;
      }
    | undefined
  >(web2Context.discord.username ? { username: web2Context.discord.username, discriminator: web2Context.discord.discriminator } : undefined);
  const [clicked, setClicked] = useState(false);

  const pollDiscord = useCallback(async () => {
    if (!currDiscordUser) {
      const user = await BitBadgesApi.checkIfSignedIn({});

      console.log('user.discord', user.discord);
      if (user.discord && user.discord.username) {
        setCurrDiscordUser(user.discord);
        web2Context.setDiscord(user.discord);
        onSuccess?.(user.discord.username, user.discord.id ?? '', user.discord.discriminator);
      }
    }
  }, [currDiscordUser, onSuccess]);

  useEffect(() => {
    if (!currDiscordUser) {
      pollDiscord();

      //Every 5 seconds
      const interval = setInterval(async () => {
        await pollDiscord();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currDiscordUser, pollDiscord]);

  useEffect(() => {
    setDisabled(!currDiscordUser?.username ? 'Not signed in' : '');
  }, [currDiscordUser]);

  return (
    <>
      <div className="flex-center flex-column">
        <div className="flex-center flex-column">
          {currDiscordUser?.username && (
            <div className="primary-text mb-2">
              @{currDiscordUser.username}
              {Number(currDiscordUser.discriminator) > 0 && `#${currDiscordUser.discriminator}`}
            </div>
          )}
          <button
            className="bg-black p-3 rounded-lg flex hover:bg-gray-800 "
            onClick={async () => {
              if (currDiscordUser?.username) {
                await BitBadgesApi.signOut({
                  signOutDiscord: true,
                  signOutBlockin: false,
                  signOutTwitter: false,
                  signOutGithub: false,
                  signOutGoogle: false
                });
                setCurrDiscordUser(undefined);
                setClicked(false);
                web2Context.setDiscord({ username: '', discriminator: '', id: '' });
              } else {
                setClicked(true);
                window.open(BACKEND_URL + '/auth/discord', '_blank');
              }
            }}>
            <div className="flex-center flex-column">
              <div className="flex-center">
                {!currDiscordUser?.username && 'Sign In to Discord'}
                {currDiscordUser?.username && 'Sign Out'}
                <svg
                  fill="#1890ff"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 640 512"
                  style={{ marginLeft: '10px', marginRight: '10px' }}>
                  <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
                </svg>
                {clicked && !currDiscordUser?.username && <Spin />}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export const ProofOfAddressPluginDetails: ClaimIntegrationPlugin<'requiresProofOfAddress'> = {
  id: 'requiresProofOfAddress',
  metadata: {
    name: 'Signed in to BitBadges',
    description: 'Require users to prove they own the claiming address via signing into BitBadges.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: false
  },
  stateString: () => '',
  createNode() {
    return (
      <div className="px-2">
        <div className="secondary-text">
          <WarningOutlined style={{ color: 'orange' }} /> Signing in requires a wallet signature (unless users previously approved another sign-in
          method).
        </div>
      </div>
    );
  },
  inputNode: ({ setDisabled }) => {
    return <ProofOfAddressInputNode setDisabled={setDisabled} />;
  },
  detailsString: () => {
    return `Must use signed in address.`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return {};
  },
  getBlankPublicState() {
    return {};
  }
};

export const TwitterPluginDetails: ClaimIntegrationPlugin<'twitter'> = {
  id: 'twitter',
  metadata: {
    name: 'X',
    description: 'Gate claims by X.',
    image: (
      <svg width="18" height="18" viewBox="0 0 1200 1227" fill="#1890ff" x="0px" y="0px" xmlns="http://www.w3.org/2000/svg">
        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
      </svg>
    ),
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state tracks the list of Twitter usernames that have claimed.',
  createNode: ({ publicParams, setParams, privateParams }) => {
    return <TwitterCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  inputNode: ({ setDisabled }) => {
    return <TwitterInputNode setDisabled={setDisabled} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'twitter'> }) => {
    const isPublicList = !!publicParams.users?.length;
    const hasPrivateList = publicParams.hasPrivateList;

    return `${
      publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
    } ${isPublicList ? `Must be in list: ${publicParams.users?.map((x) => `@${x}`).join(', ')}.` : ''}
    ${hasPrivateList ? 'Restricted to specific users.' : ''} ${publicParams.listUrl ? `${publicParams.listUrl}` : ''}`;
  },
  getBlankPrivateParams() {
    return { users: [] };
  },
  getBlankPublicParams() {
    return { users: [], maxUsesPerUser: 1, hasPrivateList: true };
  },
  getBlankPublicState() {
    return { users: [] };
  }
};

export const DiscordPluginDetails: ClaimIntegrationPlugin<'discord'> = {
  id: 'discord',
  metadata: {
    name: 'Discord',
    description: 'Gate by Discord usernames and/or server.',
    image: (
      <svg fill="#1890ff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height="18">
        <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
      </svg>
    ),
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state keeps track of the list of Discord usernames that have claimed.',
  inputNode: ({ setDisabled }) => {
    return (
      <div>
        <DiscordInputNode setDisabled={setDisabled} />
      </div>
    );
  },
  createNode: ({ publicParams, privateParams, setParams }) => {
    return <GenericOAuthCreateNode publicParams={publicParams} privateParams={privateParams} setParams={setParams} noun={'user'} appName="discord" />;
  },
  detailsString: ({ publicParams }) => {
    const isPublicList = !!publicParams.users?.length;
    if (!isPublicList) {
      return `One claim per Discord user (private user list).`;
    }

    return `${
      publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
    } Restricted to specific users ${publicParams.serverId ? ` in the ${publicParams.serverName} server` : ''}${
      publicParams.users && publicParams.users.length > 0 ? ` with usernames ${publicParams.users.map((x) => '@' + x).join(', ')}` : ''
    }.${publicParams.hasPrivateList ? ' Restricted to specific users.' : ''} ${publicParams.listUrl ? `${publicParams.listUrl}` : ''}`;
  },
  getBlankPrivateParams() {
    return { users: [] };
  },
  getBlankPublicParams() {
    return { users: [], serverId: '', serverName: '', maxUsesPerUser: 1, hasPrivateList: true };
  },
  getBlankPublicState() {
    return { numUses: 0, hasPrivateList: true };
  }
};

export const GithubPluginDetails: ClaimIntegrationPlugin<'github'> = {
  id: 'github',
  metadata: {
    name: 'Github',
    description: 'Gate claims by Github.',
    image: <GithubOutlined />,
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state tracks the list of Github usernames that have claimed.',
  createNode: ({ publicParams, setParams, privateParams }) => {
    return <GithubCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  inputNode: ({ setDisabled }) => {
    return <GithubInputNode setDisabled={setDisabled} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'github'> }) => {
    const isPublicList = !!publicParams.users?.length;
    const hasPrivateList = publicParams.hasPrivateList;

    return `${
      publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
    } ${isPublicList ? `Must be in list: ${publicParams.users?.map((x) => `@${x}`).join(', ')}.` : ''}
    ${hasPrivateList ? 'Restricted to specific users.' : ''} ${publicParams.listUrl ? `${publicParams.listUrl}` : ''}`;
  },
  getBlankPrivateParams() {
    return { users: [] };
  },
  getBlankPublicParams() {
    return { users: [], maxUsesPerUser: 1, hasPrivateList: true };
  },
  getBlankPublicState() {
    return { users: [] };
  }
};

export const GooglePluginDetails: ClaimIntegrationPlugin<'google'> = {
  id: 'google',
  metadata: {
    name: 'Google',
    description: 'Gate claims by Google.',
    image: <GoogleOutlined />,
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state tracks the list of Google usernames that have claimed.',
  createNode: ({ publicParams, setParams, privateParams }) => {
    return <GoogleCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  inputNode: ({ setDisabled }) => {
    return <GoogleInputNode setDisabled={setDisabled} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'google'> }) => {
    const isPublicList = !!publicParams.users?.length;
    const hasPrivateList = publicParams.hasPrivateList;

    return `${
      publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
    } ${isPublicList ? `Must be in list: ${publicParams.users?.map((x) => `@${x}`).join(', ')}.` : ''}
    ${hasPrivateList ? 'Restricted to specific users.' : ''} ${publicParams.listUrl ? `${publicParams.listUrl}` : ''}`;
  },
  getBlankPrivateParams() {
    return { users: [] };
  },
  getBlankPublicParams() {
    return { users: [], maxUsesPerUser: 1, hasPrivateList: true };
  },
  getBlankPublicState() {
    return { users: [] };
  }
};

export const EmailPluginDetails: ClaimIntegrationPlugin<'email'> = {
  id: 'email',
  metadata: {
    name: 'Email',
    description: 'Gate claims by Email.',
    image: <MailOutlined />,
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state tracks the list of email addresses that have claimed.',
  createNode: ({ publicParams, setParams, privateParams }) => {
    return <EmailCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  // inputNode is not displayed bc we just auto pass the email fromt heir account
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'email'> }) => {
    const isPublicList = !!publicParams.users?.length;
    const hasPrivateList = publicParams.hasPrivateList;

    return `${
      publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
    } ${isPublicList ? `Must be in list: ${publicParams.users?.map((x) => `${x}`).join(', ')}.` : ''}
    ${hasPrivateList ? 'Restricted to specific users.' : ''} ${publicParams.listUrl ? `${publicParams.listUrl}` : ''}`;
  },
  getBlankPrivateParams() {
    return { users: [] };
  },
  getBlankPublicParams() {
    return { users: [], maxUsesPerUser: 1, hasPrivateList: true };
  },
  getBlankPublicState() {
    return { users: [] };
  }
};

// export const StripePluginDetails: ClaimIntegrationPlugin<'stripe'> = {
//   id: 'stripe',
//   metadata: {
//     name: 'Stripe',
//     description: 'Gate claims by Stripe.',
//     image: (
//       <svg width="18" height="18" viewBox="0 0 1200 1227" fill="#1890ff" x="0px" y="0px" xmlns="http://www.w3.org/2000/svg">
//         <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
//       </svg>
//     ),
//     createdBy: 'BitBadges',
//     stateless: false,
//     scoped: true,
//     onChainCompatible: true
//   },
//   stateString: () => 'The state tracks the list of usernames that have claimed.',
//   createNode: ({ publicParams, setParams, privateParams }) => {
//     return <StripeCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
//   },
//   inputNode: ({ setDisabled }) => {
//     return <StripeInputNode setDisabled={setDisabled} />;
//   },
//   detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'stripe'> }) => {
//     const isPublicList = !!publicParams.users?.length;

//     return `${
//       publicParams.maxUsesPerUser ? `Max ${publicParams.maxUsesPerUser} claims per user.` : 'No limit on claims per user.'
//     } Must be in list${isPublicList ? `: ${publicParams.users?.map((x) => `@${x}`).join(', ')}.` : ' (private list).'}`;
//   },
//   getBlankPrivateParams() {
//     return {};
//   },
//   getBlankPublicParams() {
//     return { users: [], maxUsesPerUser: 1 };
//   },
//   getBlankPublicState() {
//     return { users: [] };
//   }
// };
