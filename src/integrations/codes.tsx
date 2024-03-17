import { CheckCircleFilled, DatabaseOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { BitBadgesAddressList, ClaimIntegrationPrivateParamsType, ClaimIntegrationPublicParamsType } from 'bitbadgesjs-sdk';
import crypto from 'crypto';
import { SHA256 } from 'crypto-js';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../bitbadges-api/contexts/TxTimelineContext';
import { CodesDisplay } from '../components/codes/CodesPasswordsDisplay';
import { ErrDisplay } from '../components/common/ErrDisplay';
import { GenericModal } from '../components/display/GenericModal';
import IconButton from '../components/display/IconButton';
import { Tabs } from '../components/navigation/Tabs';
import { MintType } from '../components/tx-timelines/step-items/ChooseBadgeTypeStepItem';
import { OffChainClaim } from '../components/tx-timelines/step-items/OffChainBalancesStepItem';
import { ClaimIntegrationPlugin } from './integrations';
import { generateCodesFromSeed } from '../components/collection-page/transferability/OffChainTransferabilityTab';

export const CodesPluginDetails: ClaimIntegrationPlugin<'codes'> = {
  id: 'codes',
  metadata: {
    name: 'Codes',
    description: 'Users must provide a valid one-time use code to claim.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: true
  },
  stateString: ({ publicParams, publicState, resetState, privateParams }) => {
    const codes = privateParams.seedCode ? generateCodesFromSeed(privateParams.seedCode, publicParams.numCodes) : privateParams.codes;

    if (resetState && publicState.usedCodes.find((x) => codes.includes(x))) {
      return (
        <>
          <span>The state tracks which codes have been used or not.</span>
          <span style={{ color: 'orange' }}> Warning: State has been reset, but some codes have already been used. These can be used again.</span>
        </>
      );
    } else {
      return 'The state tracks which codes have been used or not.';
    }
  },
  createNode: ({ privateParams, setParams, numClaims, setDisabled, claim, isUpdate }) => {
    return (
      <CodesCreateNode
        privateParams={privateParams}
        setParams={setParams}
        numClaims={numClaims}
        setDisabled={setDisabled}
        claim={claim}
        isUpdate={isUpdate}
      />
    );
  },
  inputNode: ({ setCustomBody }) => {
    return <CodesInputNode setCustomBody={setCustomBody} />;
  },
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'codes'> }) => {
    return `One claim per code. ${publicParams.numCodes ? ` ${publicParams.numCodes} codes available.` : ''}`;
  },
  getBlankPrivateParams() {
    return {
      codes: [],
      seedCode: ''
    };
  },
  getBlankPublicParams() {
    return { numCodes: 0 };
  },
  getBlankPublicState() {
    return {
      usedCodes: []
    };
  }
};
const CodesInputNode = ({ setCustomBody }: { setCustomBody: (customBody: object) => void }) => {
  const router = useRouter();

  const [code, setCode] = useState(router.query.code);

  useEffect(() => {
    if (router.query.code) {
      setCustomBody({ code: router.query.code });
      setCode(router.query.code);
    }
  }, [router.query.code]);

  return (
    <div>
      <b style={{ textAlign: 'center' }}>Code</b>
      <Input
        value={code}
        onChange={(e) => {
          setCustomBody({ code: e.target.value });
          setCode(e.target.value);
        }}
        className="primary-text inherit-bg"
        style={{ textAlign: 'center' }}
      />
    </div>
  );
};

const CodesCreateNode = ({
  privateParams,
  setParams,
  numClaims,
  setDisabled,
  claim,
  isUpdate
}: {
  privateParams: ClaimIntegrationPrivateParamsType<'codes'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'codes'>, privateParams: ClaimIntegrationPrivateParamsType<'codes'>) => void;
  numClaims: number;
  setDisabled: (disabled: string) => void;
  claim: Readonly<OffChainClaim<bigint>>;
  isUpdate: boolean;
}) => {
  const codes = useMemo(() => {
    let codes = privateParams?.codes ?? [];
    if (privateParams?.seedCode) {
      let currCode = privateParams.seedCode;
      codes = [];
      for (let i = 0; i < numClaims; i++) {
        currCode = SHA256(currCode + privateParams.seedCode).toString();
        codes.push(currCode);
      }
    }

    return codes;
  }, [privateParams, numClaims]);

  const [inputStr, setInputStr] = useState(codes.join(', '));
  const [visible, setVisible] = useState(false);

  const [origParams] = useState(privateParams);
  const [origPublicParams] = useState({ numCodes: numClaims });

  const [tab, setTab] = useState(isUpdate ? 'keep' : 'auto-gen');

  let tabInfos = [
    {
      key: 'auto-gen',
      content: 'Auto'
    },
    {
      key: 'keep',
      content: 'Keep'
    },
    {
      key: 'custom',
      content: 'Custom'
    }
  ];
  if (!isUpdate) {
    tabInfos = tabInfos.filter((x) => x.key !== 'keep');
  }

  const autoGenerate = tab === 'auto-gen';

  const txTimelineContext = useTxTimelineContext();

  const autoGenSeed = useMemo(() => {
    return crypto.randomBytes(32).toString('hex');
  }, []);

  const autoGenCodes = useMemo(() => {
    let codes = [];
    let currCode = crypto.randomBytes(32).toString('hex');
    const seedCode = currCode;
    for (let i = 0; i < numClaims; i++) {
      currCode = SHA256(currCode + seedCode).toString();
      codes.push(currCode);
    }

    return codes;
  }, [numClaims]);

  useEffect(() => {
    switch (tab) {
      case 'auto-gen':
        setParams(
          {
            numCodes: autoGenCodes.length
          },
          {
            seedCode: autoGenSeed,
            codes: []
          }
        );
        break;
      case 'keep':
        setParams(origPublicParams, origParams);
        break;
      case 'custom':
        const codes = inputStr.split(',').map((x) => x.trim());
        setParams({ numCodes: numClaims }, { seedCode: '', codes });
        break;
    }
  }, [tab, numClaims, inputStr, autoGenCodes, autoGenSeed, origParams, origPublicParams]); //origParams, origPublicParams, setParams

  useEffect(() => {
    setDisabled(codes.length !== numClaims ? 'Must provide ' + numClaims + ' code(s) to match number of claims.' : '');
  }, [codes, numClaims]);

  return (
    <div>
      <br />
      <div className="flex-center flex-wrap mb-8">
        <Tabs tabInfo={tabInfos} tab={tab} setTab={setTab} type="underline" />
      </div>
      {tab == 'keep' && (
        <div style={{ fontSize: 16 }}>
          <div className="flex-center flex-wrap">
            {codes.length} Codes Unchanged <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />
          </div>
        </div>
      )}
      {tab == 'custom' && (
        <>
          <Input
            value={inputStr}
            onChange={(e) => {
              setInputStr(e.target.value);
              setDisabled(e.target.value.split(',').length !== numClaims ? 'Must provide ' + numClaims + ' code(s) to match number of claims.' : '');
            }}
            className="primary-text inherit-bg"
            style={{ textAlign: 'center' }}
          />
          <br />
          <br />
        </>
      )}
      {autoGenerate && (
        <div style={{ fontSize: 16 }}>
          <div className="flex-center flex-wrap">
            {codes.length} Codes Newly Generated <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />
          </div>
        </div>
      )}
      {numClaims !== (codes?.length ?? 0) && <ErrDisplay err={`Must provide ${numClaims} code(s) to match number of claims.`} />}
      <div className="flex-center flex-wrap">
        <IconButton
          src={<DatabaseOutlined />}
          text="Distribute"
          onClick={() => {
            setVisible(true);
          }}
          secondary
        />
        <PluginCodesModal
          claim={claim}
          codes={codes ?? []}
          collectionId={
            txTimelineContext.mintType === MintType.AddressList
              ? undefined
              : txTimelineContext.existingCollectionId
                ? txTimelineContext.existingCollectionId
                : NEW_COLLECTION_ID
          }
          list={
            txTimelineContext.mintType === MintType.AddressList
              ? txTimelineContext.isUpdateAddressList
                ? txTimelineContext.addressList
                : undefined
              : undefined
          }
          visible={visible}
          setVisible={setVisible}
        />
      </div>
    </div>
  );
};

export const PluginCodesModal = ({
  codes,
  password,
  collectionId,
  list,
  visible,
  setVisible,
  claim
}: {
  codes?: string[];
  password?: string;
  list?: BitBadgesAddressList<bigint>;
  collectionId?: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  claim: OffChainClaim<bigint>;
}) => {
  return (
    <GenericModal requireConnected requireLoggedIn title="Codes" setVisible={setVisible} visible={visible} style={{ minWidth: '90%' }}>
      <CodesDisplay collectionId={collectionId} codes={codes} claimPassword={password} list={list} claim={claim} />
    </GenericModal>
  );
};
