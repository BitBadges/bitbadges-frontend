import { Layout, Tooltip } from 'antd';
import 'react-markdown-editor-lite/lib/index.css';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleFilled, WarningOutlined } from '@ant-design/icons';
import { BlockinAuthSignatureInfo, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { deleteAuthCode, getAuthCode } from '../../../bitbadges-api/api';
import { getAuthCodesView, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../../components/address/AddressDisplay';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { BalanceDisplay } from '../../../components/badges/balances/BalanceDisplay';
import { EmptyIcon } from '../../../components/common/Empty';
import CustomCarousel from '../../../components/display/Carousel';
import { Divider } from '../../../components/display/Divider';
import IconButton from '../../../components/display/IconButton';
import { InformationDisplayCard } from '../../../components/display/InformationDisplayCard';
import { TableRow } from '../../../components/display/TableRow';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../../utils/dates';

const { Content } = Layout;

export const AuthCode = ({ authCode }: { authCode: BlockinAuthSignatureInfo<bigint> }) => {
  const [currStatus, setCurrStatus] = useState({ success: false, verificationMessage: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      if (loaded) return;
      if (!authCode.signature) {
        setCurrStatus({ success: false, verificationMessage: 'No signature provided.' });
        setLoaded(true);
        return;
      }

      try {
        const res = await getAuthCode({ signature: authCode.signature, options: {} });
        setCurrStatus(res.verificationResponse);
      } catch (e: any) {
        setCurrStatus({ success: false, verificationMessage: e.message });
      }
      setLoaded(true);
    })();
  }, [authCode.signature, loaded]);

  const x = authCode;
  const validFrom = [{
    start: x.params.notBefore ? BigInt(new Date(x.params.notBefore).getTime()) : BigInt(x.createdAt),
    end: x.params.expirationDate ? BigInt(new Date(x.params.expirationDate).getTime()) : GO_MAX_UINT_64
  }]

  return <div className='flex-center flex-column full-width'>
    <CollectionHeader
      collectionId={1n} //dummy value
      metadataOverride={{
        ...x,
      }}
      hideCollectionLink
    />
    <div className='flex-center flex-column'>
      <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
        {x.description}
      </div>
      <br />
      {x.signature && <>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
          <QRCode value={x.signature} size={256} />
        </div>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
          <WarningOutlined style={{ color: 'orange', marginRight: 8 }} /> Anyone with this QR code can authenticate as you. Keep it safe and secret.
          <br />
          <br />
          <InfoCircleFilled style={{ marginRight: 8 }} /> We recommend storing this QR code elsewhere for easier presentation at authentication time.
          Options include, but are not limited to, printing it out, saving to your device, or screenshotting it.
          <br />
          <br />
          Reminder: If you are signed out of BitBadges, you need to sign in with your crypto wallet which you may not have handy at authentication time.
          This is why we recommend storing the QR code elsewhere.
        </div>
        <Divider />
      </>
      }
    </div>
    <div >

      <InformationDisplayCard span={24} title='Details' inheritBg noBorder>
        {/* const paramKeyOrder = [ 'statement', 'nonce', 'signature', 'description']; */}
        {x.signature && <TableRow label={'ID'} value={<Tooltip title={x.signature}><div style={{ float: 'right' }}>{getAbbreviatedAddress(x.signature)}</div></Tooltip>} labelSpan={8} valueSpan={16} />}
        <TableRow label={'Address'} value={<div style={{ float: 'right' }}><AddressDisplay addressOrUsername={x.params.address} /></div>} labelSpan={8} valueSpan={16} />
        <TableRow label={'Domain'} value={<a href={x.params.domain} target='_blank' rel="noreferrer">{x.params.domain}</a>} labelSpan={8} valueSpan={16} />
        {x.params.uri !== x.params.domain && <TableRow label={'URI'} value={<a href={x.params.uri} target='_blank' rel="noreferrer">{x.params.uri}</a>} labelSpan={8} valueSpan={16} />}
        <TableRow label={'Statement'} value={x.params.statement} labelSpan={8} valueSpan={16} />
        <TableRow label={'Issued At'} value={new Date(Number(x.createdAt)).toLocaleString()} labelSpan={8} valueSpan={16} />
        <TableRow label={'Valid From'} value={<>{getTimeRangesElement(validFrom)}
          {BigInt(Date.now()) < validFrom[0].start || BigInt(Date.now()) > validFrom[0].end ? <CloseCircleFilled style={{ color: 'red', marginLeft: 8 }} /> : <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />}
        </>} labelSpan={8} valueSpan={16} />

        <TableRow label={'Nonce'} value={x.params.nonce} labelSpan={8} valueSpan={16} />
        {x.params.chainId && <TableRow label={'Chain ID'} value={x.params.chainId} labelSpan={8} valueSpan={16} />}
        {x.params.version && <TableRow label={'Version'} value={x.params.version} labelSpan={8} valueSpan={16} />}
        {x.params.resources && !!x.params.resources.length ? <TableRow label={'Resources'} value={x.params.resources.join(', ')} labelSpan={8} valueSpan={16} /> : <></>}
        {x.params.assets && !!x.params.assets.length ? <TableRow label={'Assets'} value={x.params.assets.map((asset, i) => {
          // export interface Asset<T extends NumberType> {
          //   chain: string;
          //   collectionId: string | NumberType;
          //   assetIds: (string | UintRange<T>)[];
          //   ownershipTimes?: UintRange<T>[];
          //   mustOwnAmounts: UintRange<T>;
          //   additionalCriteria?: string;
          // }


          return <div key={i}>
            {asset.chain === 'BitBadges' ? <>
              <BalanceDisplay
                collectionId={BigInt(asset.collectionId)}
                isMustOwnBadgesInput
                mustOwnBadges={[{
                  amountRange: asset.mustOwnAmounts,
                  badgeIds: asset.assetIds.map(x => typeof x === 'string' ? { start: BigInt(x), end: BigInt(x) } : x),
                  collectionId: BigInt(asset.collectionId),
                  ownershipTimes: asset.ownershipTimes ?? [],
                  overrideWithCurrentTime: false,
                  mustOwnAll: false,
                }]}
                balances={[]}
              />
            </> : <></>
            }
          </div>
        })} labelSpan={8} valueSpan={16} /> : <></>}
      </InformationDisplayCard>
      {x.signature &&
        <InformationDisplayCard span={24} title='Current Status' inheritBg noBorder>
          <div className='secondary-text flex-center' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
            {currStatus.success ? <div className='flex-center'>
              <CheckCircleFilled style={{ color: 'green', fontSize: 24, marginRight: 8 }} />
            </div> : <div className='flex-center'>
              <CloseCircleFilled style={{ color: 'red', fontSize: 24, marginRight: 8 }} />
            </div>} {currStatus.verificationMessage}
          </div>
        </InformationDisplayCard>}
    </div>
  </div>
}

export function AuthCodes() {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState(false);

  const [authCodes, setAuthCodes] = useState(getAuthCodesView(signedInAccount, 'authCodes'));

  useEffect(() => {
    setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
  }, [signedInAccount]);

  const items = authCodes.map((x) => {
    if (!x) return <></>;
    return <>
      <AuthCode authCode={x} />
      <Divider />
      <IconButton
        src={<DeleteOutlined />}
        text='Delete'
        disabled={loading}
        onClick={async () => {
          if (!signedInAccount) return;
          setLoading(true);
          if (confirm('Are you sure you want to delete this QR code?')) {
            await deleteAuthCode({ signature: x.signature });
            window.location.reload();
          }
          setLoading(false);
        }}
        tooltipMessage='Delete this QR code'
      />
    </>
  });



  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <Content
          className="full-area"
          style={{ minHeight: '100vh', padding: 8 }}
        >
          {signedInAccount && <>
            <br />
            <div className='flex-center'>
              {authCodes.length > 0 && <InformationDisplayCard md={12} xs={24} sm={24} title='' >

                <CustomCarousel
                  title={<div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder' }}>My QR  Codes</div>}
                  items={items}
                />
              </InformationDisplayCard>}
            </div>

            {authCodes.length === 0 && <div className='flex-center flex-column'>
              <EmptyIcon description='No QR codes found. Events should provide you with details on how to generate QR codes for authentication.' />
            </div>}
          </>}
        </ Content>
      }
    />
  );
}

export default AuthCodes;