import { CheckCircleFilled, OrderedListOutlined, FormOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType } from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import { useTxTimelineContext, NEW_COLLECTION_ID } from '../bitbadges-api/contexts/TxTimelineContext';
import { CodesDisplay } from '../components/codes/CodesPasswordsDisplay';
import { ErrDisplay } from '../components/common/ErrDisplay';
import { GenericModal } from '../components/display/GenericModal';
import IconButton from '../components/display/IconButton';
import { MintType } from '../components/tx-timelines/step-items/ChooseBadgeTypeStepItem';
import { ClaimIntegrationPlugin } from './integrations';
import crypto from 'crypto';

export const CodesPluginDetails: ClaimIntegrationPlugin<'codes'> = {
  id: 'codes',
  metadata: {
    name: 'Codes',
    description: 'Users must provide a valid code to claim.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: false,
    scoped: true,
    onChainCompatible: false
  },
  createNode: ({ privateParams, setParams, numClaims, setDisabled }) => {
    return <CodesCreateNode privateParams={privateParams} setParams={setParams} numClaims={numClaims} setDisabled={setDisabled} />;
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
  setDisabled
}: {
  privateParams: ClaimIntegrationPrivateParamsType<'codes'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'codes'>, privateParams: ClaimIntegrationPrivateParamsType<'codes'>) => void;
  numClaims: number;
  setDisabled: (disabled: string) => void;
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
  const [autoGenerate, setAutoGenerate] = useState(false);
  const txTimelineContext = useTxTimelineContext();

  return (
    <div>
      <br />
      {!autoGenerate && (
        <>
          <Input
            value={inputStr}
            onChange={(e) => {
              setInputStr(e.target.value);
              setParams(
                {
                  numCodes: e.target.value.split(',').length
                },
                {
                  codes: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter((x) => x),
                  seedCode: ''
                }
              );

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
            {codes.length} Codes Generated <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />
          </div>
        </div>
      )}
      {numClaims !== (codes?.length ?? 0) && <ErrDisplay err={`Must provide ${numClaims} code(s) to match number of claims.`} />}
      <div className="flex-center flex-wrap">
        {!autoGenerate && (
          <IconButton
            src={<OrderedListOutlined />}
            text="Auto-Gen"
            onClick={() => {
              const codes = [];

              let currCode = crypto.randomBytes(32).toString('hex');
              const seedCode = currCode;
              for (let i = 0; i < numClaims; i++) {
                currCode = SHA256(currCode + seedCode).toString();
                codes.push(currCode);
              }

              setParams(
                {
                  numCodes: codes.length
                },
                {
                  seedCode: seedCode,
                  codes: []
                }
              );
              setDisabled(codes.length !== numClaims ? 'Must provide ' + numClaims + ' code(s) to match number of claims.' : '');
              setAutoGenerate(true);
            }}
            secondary
          />
        )}
        {autoGenerate && (
          <IconButton
            src={<FormOutlined />}
            text="Custom"
            onClick={() => {
              setAutoGenerate(false);
              const codes = inputStr.split(',').map((x) => x.trim());
              setParams({ numCodes: numClaims }, { seedCode: '', codes });
              setDisabled(codes.length !== numClaims ? 'Must provide ' + numClaims + ' code(s) to match number of claims.' : '');
            }}
            secondary
          />
        )}
        <IconButton
          src={<DatabaseOutlined />}
          text="Distribute"
          onClick={() => {
            setVisible(true);
          }}
          secondary
        />
        <PluginCodesModal
          codes={codes ?? []}
          collectionId={
            txTimelineContext.mintType === MintType.AddressList
              ? undefined
              : txTimelineContext.existingCollectionId
                ? txTimelineContext.existingCollectionId
                : NEW_COLLECTION_ID
          }
          listId={
            txTimelineContext.mintType === MintType.AddressList
              ? txTimelineContext.isUpdateAddressList
                ? txTimelineContext.addressList.listId
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
  listId,
  visible,
  setVisible
}: {
  codes?: string[];
  password?: string;
  listId?: string;
  collectionId?: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) => {
  return (
    <GenericModal title="Codes" setVisible={setVisible} visible={visible} style={{ minWidth: '90%' }}>
      <CodesDisplay collectionId={collectionId} codes={codes} claimPassword={password} listId={listId} />
    </GenericModal>
  );
};
