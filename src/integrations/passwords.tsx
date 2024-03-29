import { DatabaseOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { ClaimIntegrationPublicParamsType, ClaimIntegrationPrivateParamsType } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useTxTimelineContext, NEW_COLLECTION_ID } from '../bitbadges-api/contexts/TxTimelineContext';
import IconButton from '../components/display/IconButton';
import { ClaimIntegrationPlugin } from './integrations';
import { PluginCodesModal } from './codes';
import { OffChainClaim } from '../components/tx-timelines/step-items/OffChainBalancesStepItem';

export const PasswordPluginDetails: ClaimIntegrationPlugin<'password'> = {
  id: 'password',
  metadata: {
    name: 'Password',
    description: 'Users must enter the password to claim.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => '',
  inputNode: ({ setCustomBody }) => {
    return <PasswordInputNode setCustomBody={setCustomBody} />;
  },
  createNode: ({ publicParams, privateParams, setParams, claim, setDisabled }) => {
    return (
      <PasswordCreateNode claim={claim} publicParams={publicParams} privateParams={privateParams} setParams={setParams} setDisabled={setDisabled} />
    );
  },
  detailsString: () => {
    return 'Must provide valid password.';
  },
  getBlankPrivateParams() {
    return {
      password: ''
    };
  },
  getBlankPublicParams() {
    return {};
  },
  getBlankPublicState() {
    return {};
  }
};

const PasswordCreateNode = ({
  publicParams,
  privateParams,
  setParams,
  claim,
  setDisabled
}: {
  publicParams: ClaimIntegrationPublicParamsType<'password'>;
  privateParams: ClaimIntegrationPrivateParamsType<'password'>;
  setParams: (publicParams: ClaimIntegrationPublicParamsType<'password'>, privateParams: ClaimIntegrationPrivateParamsType<'password'>) => void;
  claim: Readonly<OffChainClaim<bigint>>;
  setDisabled: (disabled: string) => void;
}) => {
  const claimPassword = privateParams?.password;
  const txTimelineContext = useTxTimelineContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDisabled(!claimPassword ? 'Password cannot be empty.' : '');
  }, [claimPassword]);

  const PasswordSelect = (
    <div style={{ textAlign: 'center' }}>
      <br />
      <b style={{ textAlign: 'center' }}>Password</b>
      <Input
        value={claimPassword}
        onChange={(e) => {
          setParams(publicParams, { password: e.target.value });
        }}
        className="primary-text inherit-bg"
        style={{ textAlign: 'center' }}
      />
      {!claimPassword && <div style={{ color: 'red' }}>Password cannot be empty.</div>}
      <div className="flex-center flex-column">
        <br />
        <IconButton
          src={<DatabaseOutlined />}
          text="Password"
          onClick={() => {
            setVisible(true);
          }}
          secondary
        />
        <PluginCodesModal
          claim={claim}
          password={claimPassword}
          collectionId={txTimelineContext.existingCollectionId ? txTimelineContext.existingCollectionId : NEW_COLLECTION_ID}
          visible={visible}
          setVisible={setVisible}
        />
      </div>
    </div>
  );

  return PasswordSelect;
};

const PasswordInputNode = ({ setCustomBody }: { setCustomBody: (customBody: object) => void }) => {
  const router = useRouter();

  const { password } = router.query;

  useEffect(() => {
    if (password) {
      setCustomBody({ password: password });
    }
  }, [password]);

  return (
    <div>
      <b style={{ textAlign: 'center' }}>Password</b>
      <Input
        onChange={(e) => {
          setCustomBody({ password: e.target.value });
        }}
        className="primary-text inherit-bg"
        style={{ textAlign: 'center' }}
      />
    </div>
  );
};
