import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Spin, Input, Tag, Divider } from 'antd';
import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType } from 'bitbadgesjs-sdk';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { BitBadgesApi } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import { BACKEND_URL } from '../constants';
import { ClaimIntegrationPlugin } from './integrations';
import { PublicPrivateSelect } from './whitelist';
import { useWeb2Context } from '../bitbadges-api/contexts/chains/Web2Context';

const TwitterInputNode = ({ setDisabled }: { setDisabled: (disabled: string) => void }) => {
  const [currTwitterUser, setCurrTwitterUser] = useState<
    | {
        username: string;
      }
    | undefined
  >(undefined);
  const [clicked, setClicked] = useState(false);

  const pollTwitter = useCallback(async () => {
    if (!currTwitterUser) {
      const user = await BitBadgesApi.checkIfSignedIn({});
      if (user.twitter) {
        setCurrTwitterUser(user.twitter);
      }
    }
  }, [currTwitterUser]);

  useEffect(() => {
    if (!currTwitterUser) {
      pollTwitter();

      //Every 5 seconds
      const interval = setInterval(async () => {
        await pollTwitter();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    setDisabled(!currTwitterUser?.username ? 'Not signed in' : '');
  }, [currTwitterUser]);

  return (
    <>
      {currTwitterUser?.username && (
        <>
          <div>Signed in as @{currTwitterUser.username}</div>
          <br />
          <br />
          <div className="flex-center">
            <button
              className="bg-black p-3 rounded-lg flex hover:bg-gray-800 "
              onClick={async () => {
                await BitBadgesApi.signOut({ signOutDiscord: false, signOutBlockin: false, signOutTwitter: true });
                setCurrTwitterUser(undefined);
                setClicked(false);
              }}>
              Sign Out
            </button>
          </div>
        </>
      )}
      {!currTwitterUser?.username && (
        <div className="flex-center">
          <button
            className="bg-black p-3 rounded-lg flex hover:bg-gray-800 "
            onClick={() => {
              setClicked(true);
              window.open(BACKEND_URL + '/auth/twitter', '_blank');
            }}>
            Sign In to
            <svg
              height="24"
              viewBox="0 0 1200 1227"
              fill="#1890ff"
              x="0px"
              y="0px"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginLeft: '10px', marginRight: '10px' }}>
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
            </svg>
            {clicked && <Spin />}
          </button>
        </div>
      )}
    </>
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
  const [privateValues, setPrivateValues] = useState<boolean>(!!privateParams.users?.length);

  const usernames = useMemo(() => {
    if (privateValues) {
      return privateParams.users ?? [];
    }

    return publicParams.users ?? [];
  }, [publicParams.users, privateParams.users, privateValues]);

  const [inputStr, setInputStr] = useState(usernames?.join(', '));

  const setUsers = (users: string[], privateUsers?: boolean) => {
    if (privateUsers) {
      setParams({}, { users });
    } else {
      setParams({ users }, {});
    }
  };

  console.log('privateValues', privateValues);
  console.log('usernames', usernames);
  console.log(publicParams, privateParams);

  return (
    <div>
      <div className="flex-center flex-column">
        <PublicPrivateSelect
          privateVal={privateValues}
          setPrivateVal={setPrivateValues}
          onChange={(val) => {
            setUsers(usernames, val);
          }}
        />
      </div>
      <br />
      <Input.TextArea
        value={inputStr}
        onChange={(e) => {
          const names = e.target.value
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name)
            .map((name) => (name.startsWith('@') ? name.slice(1) : name));
          setInputStr(e.target.value);
          console.log(names);

          setUsers(names, privateValues);
        }}
        className="primary-text inherit-bg"
      />
      <div className="secondary-text">
        <InfoCircleOutlined /> Separate usernames with a comma (abc, xyz). If none are provided, there will be no username restriction.
      </div>
      <br />
      {usernames.map((name) => {
        const displayname = name.startsWith('@') ? name : `@${name}`;
        return (
          <Tag
            key={name}
            closable
            onClose={() => {
              setUsers(
                usernames.filter((n) => n !== name),
                privateValues
              );
              setInputStr(usernames.filter((n) => n !== name).join(', '));
            }}>
            {displayname}
          </Tag>
        );
      })}
    </div>
  );
};

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

const DiscordCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  privateParams: ClaimIntegrationPrivateParamsType<'discord'>;
  publicParams: ClaimIntegrationPublicParamsType<'discord'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'discord'>, privateParams: ClaimIntegrationPrivateParamsType<'discord'>) => void;
}) => {
  const isPrivate = !!privateParams?.users?.length;

  const [privateValues, setPrivateValues] = useState<boolean>(isPrivate);
  const [inputStr, setInputStr] = useState(publicParams.users?.join(', '));

  const setUsers = (users: string[], serverId: string, serverName: string, privateUsers?: boolean) => {
    if (privateUsers) {
      setParams({}, { users, serverId, serverName });
    } else {
      setParams({ users, serverId, serverName }, {});
    }
  };

  const usernames = useMemo(() => {
    if (privateValues) {
      return privateParams.users ?? [];
    }

    return publicParams.users ?? [];
  }, [publicParams.users, privateParams.users, privateValues]);

  const serverId = useMemo(() => {
    if (privateValues) {
      return privateParams.serverId ?? '';
    }

    return publicParams.serverId ?? '';
  }, [publicParams.serverId, privateParams.serverId, privateValues]);

  const serverName = useMemo(() => {
    if (privateValues) {
      return privateParams.serverName ?? '';
    }

    return publicParams.serverName ?? '';
  }, [publicParams.serverName, privateParams.serverName, privateValues]);

  return (
    <div>
      <div className="flex-center flex-column">
        <PublicPrivateSelect
          privateVal={privateValues}
          setPrivateVal={setPrivateValues}
          onChange={(val) => {
            setUsers(usernames, serverId, serverName, val);
          }}
        />
      </div>
      <br />
      <b>Server ID</b>
      <Input
        value={serverId}
        onChange={(e) => {
          setUsers(usernames ?? [], e.target.value, serverName, privateValues);
        }}
        className="primary-text inherit-bg"
      />
      <br />
      <div className="secondary-text">
        <InfoCircleOutlined /> If no server ID is provided, there will be no server restriction. See{' '}
        <a href="https://docs.bitbadges.io/overview/claim-builder/discord" target="_blank" rel="noreferrer">
          here
        </a>{' '}
        for how to get your server ID. This is a large number (e.g. 846474505189588992), not the server name.
      </div>
      {serverId && (
        <>
          <br />
          <b>Server Name</b>
          <Input
            value={serverName}
            onChange={(e) => {
              setUsers(usernames ?? [], serverId, e.target.value, privateValues);
            }}
            className="primary-text inherit-bg"
          />
          <br />
          <div className="secondary-text">
            <InfoCircleOutlined /> Provide a display name for the server.
          </div>
        </>
      )}

      <Divider />
      <b>Usernames</b>
      <Input.TextArea
        value={inputStr}
        onChange={(e) => {
          const names = e.target.value
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name)
            .map((name) => (name.startsWith('@') ? name.slice(1) : name));
          setInputStr(e.target.value);

          setUsers(names, serverId, serverName, privateValues);
        }}
        className="primary-text inherit-bg"
      />
      <div className="secondary-text">
        <InfoCircleOutlined /> Separate usernames with a comma (abc, xyz#5747). If none are provided, there will be no username restriction.
      </div>
      <br />
      <div className="flex flex-wrap">
        {usernames.map((name) => {
          const displayname = name.startsWith('@') ? name : `@${name}`;
          return (
            <Tag
              key={name}
              closable
              onClose={() => {
                setUsers(
                  usernames.filter((n) => n !== name),
                  serverId,
                  serverName,
                  privateValues
                );
                setInputStr(usernames.filter((n) => n !== name).join(', '));
              }}>
              {displayname}
            </Tag>
          );
        })}
      </div>
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
                await BitBadgesApi.signOut({ signOutDiscord: true, signOutBlockin: false, signOutTwitter: false });
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
    name: 'Verify Address Ownership',
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
          <WarningOutlined style={{ color: 'orange' }} /> Signing in requires a wallet signature. It should be expected that users have wallets handy.
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
    description: 'Gate claims by X usernames. One claim per username.',
    image: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 1200 1227"
        fill="#1890ff"
        x="0px"
        y="0px"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '10px' }}>
        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
      </svg>
    ),
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state is the list of Twitter usernames that have claimed.',
  createNode: ({ publicParams, setParams, privateParams }) => {
    return <TwitterCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  inputNode: ({ setDisabled }) => {
    return <TwitterInputNode setDisabled={setDisabled} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'twitter'> }) => {
    const isPublicList = !!publicParams.users?.length;

    return `One claim per Twitter user${isPublicList ? ` in list: ${publicParams.users?.map((x) => `@${x}`).join(', ')}.` : ' (private list).'}`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { users: [] };
  },
  getBlankPublicState() {
    return { users: [] };
  }
};

export const DiscordPluginDetails: ClaimIntegrationPlugin<'discord'> = {
  id: 'discord',
  metadata: {
    name: 'Discord',
    description: 'Gate by Discord usernames and/or server. One claim per username.',
    image: (
      <svg fill="#1890ff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height="18" style={{ marginRight: '10px' }}>
        <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
      </svg>
    ),
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => 'The state is the list of Discord usernames that have claimed.',
  inputNode: ({ setDisabled }) => {
    return (
      <div>
        <DiscordInputNode setDisabled={setDisabled} />
      </div>
    );
  },
  createNode: ({ publicParams, privateParams, setParams }) => {
    return <DiscordCreateNode publicParams={publicParams} setParams={setParams} privateParams={privateParams} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'discord'> }) => {
    const isPublicList = !!publicParams.users?.length;
    if (!isPublicList) {
      return `One claim per Discord user (private user list).`;
    }

    return `One claim per Discord user${publicParams.serverId ? ` in the ${publicParams.serverName} server` : ''}${
      publicParams.users && publicParams.users.length > 0 ? ` with usernames ${publicParams.users.map((x) => '@' + x).join(', ')}` : ''
    }.`;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { users: [], serverId: '', serverName: '' };
  },
  getBlankPublicState() {
    return { numUses: 0 };
  }
};
