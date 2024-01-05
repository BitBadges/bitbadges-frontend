import { Layout, Tooltip } from 'antd';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, BlockinAuthSignatureDoc, convertBlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { deleteAuthCode, getAuthCode } from '../../bitbadges-api/api';
import { getAuthCodesView, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import CustomCarousel from '../../components/display/Carousel';
import { Divider } from '../../components/display/Divider';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import QrCodeDisplay from '../../components/display/QrCodeDisplay';
import { TableRow } from '../../components/display/TableRow';
import { Tabs } from '../../components/navigation/Tabs';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';


const { Content } = Layout;

export const AuthCode = ({ authCode, storeLocally }: { authCode: BlockinAuthSignatureDoc<bigint>, storeLocally?: boolean }) => {
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
      multiDisplay

    />
    <div className='flex-center flex-column'>
      <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
        {x.description}
      </div>
      <QrCodeDisplay
        label={x.name}
        value={x.signature}
        storeLocally={storeLocally}
        authCode={x}
        helperDisplay={<div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
          <WarningOutlined style={{ color: 'orange', marginRight: 8 }} /> Anyone with this QR code can authenticate as you. Keep it safe and secret.
          <br />
          <br />
          <InfoCircleFilled style={{ marginRight: 8 }} /> We strongly recommend storing this QR code elsewhere for easier presentation at authentication time.
          Otherwise, ensure you are logged into your BitBadges account (if not, you will need another wallet signature to authenticate).
        </div>}

      />
    </div>
    <Divider />
    {x.signature &&
      <InformationDisplayCard span={24} title='Current Status' inheritBg noBorder>
        <div className='secondary-text' style={{ fontSize: 16, textAlign: 'center', alignItems: 'center' }}>
          {currStatus.success ?
            <CheckCircleFilled style={{ color: 'green', marginRight: 8 }} />
            :
            <CloseCircleFilled style={{ color: 'red', marginRight: 8 }} />
          } {currStatus.verificationMessage}
        </div>
      </InformationDisplayCard>}
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
        {x.params.assets && !!x.params.assets.length ? <TableRow label={'Ownership Requirements'} value={x.params.assets.map((asset, i) => {
          const chainName = asset.chain;

          return <div key={i}>
            You must own {[asset.mustOwnAmounts].map(amount => {
              if (typeof amount !== 'object') {
                return 'x' + BigInt(amount).toString();
              } else {
                if (amount.start === amount.end) {
                  return `x${BigInt(amount.start).toString()}`
                }
                return `x${BigInt(amount.start).toString()}-${BigInt(amount.end).toString()}`
              }
            }).join(', ')} of {asset.assetIds.map((assetId, index) => {
              if (typeof assetId !== 'object') {
                return <>{"ID: " + assetId.toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
              } else {
                if (assetId.start === assetId.end) {
                  return <>ID {BigInt(assetId.start).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
                }
                return <>IDs {BigInt(assetId.start).toString()}-{BigInt(assetId.end).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
              }
            })} from {chainName + " Collection: " + asset.collectionId.toString()} {asset.ownershipTimes ? 'from ' +
              asset.ownershipTimes.map(time => {
                if (typeof time === 'string') {
                  return new Date(time).toLocaleString();
                } else if (typeof time !== 'object') {
                  return new Date(Number(BigInt(time))).toLocaleString();
                } else {
                  return `${new Date(Number(BigInt(time.start))).toLocaleString()} until ${new Date(Number(BigInt(time.end))).toLocaleString()}`
                }
              }).join(', ') : 'at the time of sign-in'} to be approved.
          </div>


          // return <div key={i}>
          //   {asset.chain === 'BitBadges' ? <>
          //     <BalanceDisplay
          //       collectionId={BigInt(asset.collectionId)}
          //       isMustOwnBadgesInput
          //       mustOwnBadges={[{
          //         amountRange: asset.mustOwnAmounts,
          //         badgeIds: asset.assetIds.map(x => typeof x === 'string' ? { start: BigInt(x), end: BigInt(x) } : x),
          //         collectionId: BigInt(asset.collectionId),
          //         ownershipTimes: asset.ownershipTimes ?? [],
          //         overrideWithCurrentTime: false,
          //         mustOwnAll: false,
          //       }]}
          //       balances={[]}
          //     />
          //   </> : <></>
          //   }
          // </div>
        })} labelSpan={8} valueSpan={16} /> : <></>}
      </InformationDisplayCard>

    </div>
  </div>
}

export function AuthCodes() {
  const chain = useChainContext();
  const router = useRouter();
  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState(false);
  const [authCodes, setAuthCodes] = useState(getAuthCodesView(signedInAccount, 'authCodes'));

  useEffect(() => {
    setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
  }, [signedInAccount]);

  const getItems = (codes: BlockinAuthSignatureDoc<bigint>[], saved?: boolean) => {
    return codes.map((x) => {
      if (!x) return <></>;
      return <div className='full-width' key={x.signature}>
        <AuthCode authCode={x} storeLocally={!saved} />
        <Divider />
        <IconButton
          src={<DeleteOutlined />}
          text='Delete'
          disabled={loading}
          onClick={async () => {
            if (!signedInAccount) return;
            if (!saved) {

              setLoading(true);
              if (confirm('Are you sure you want to delete this QR code?')) {
                await deleteAuthCode({ signature: x.signature });
                window.location.reload();
              }
              setLoading(false);
            } else {
              const existingAuthCodes = localStorage.getItem('savedAuthCodes');
              const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
              const newAuthCodes = authCodes.filter((y: any) => y.signature !== x.signature);
              localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));
              window.location.reload();
            }
          }}
          tooltipMessage='Delete this QR code'
        />
      </div>
    });
  }

  const [tab, setTab] = useState('all');
  const [savedAuthCodes, setSavedAuthCodes] = useState<BlockinAuthSignatureDoc<bigint>[]>([]);

  useEffect(() => {
    //Check local storage
    const savedAuthCodes = localStorage.getItem('savedAuthCodes');
    if (savedAuthCodes) {
      setSavedAuthCodes(JSON.parse(savedAuthCodes).map((x: any) => convertBlockinAuthSignatureDoc(x, BigIntify)));
    }
  }, []);

  const items = getItems(authCodes);
  const savedItems = getItems(savedAuthCodes, true);


  return (<>
    <Content
      className="full-area"
      style={{ minHeight: '80vh', padding: 8 }}
    >
      <br />
      <div className='flex-center'>

        <Tabs
          tab={tab}
          setTab={setTab}
          tabInfo={[
            { key: 'all', content: 'All' },
            { key: 'saved', content: 'Saved' }
          ]}
          type='underline'
        />
      </div>
      <br />
      <div className='secondary-text' style={{ textAlign: 'center' }}>
        <InfoCircleOutlined /> {tab == 'all' ? 'All QR codes for this account (must be signed in).' : 'QR codes you have saved to the browser on this device.'}
      </div>

      <br />
      {tab == 'all' && <>
        {!signedInAccount || !chain.loggedIn ? <>
          <div className='flex-center flex-column'>
            <BlockinDisplay />
          </div>
        </> : <>
          <br />

          <div className='flex-center'>
            {authCodes.length > 0 && <InformationDisplayCard md={12} xs={24} sm={24} title='' >

              <CustomCarousel
                title={<div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder' }}>My QR  Codes</div>}
                items={items}
                showTotalMobile
              />
            </InformationDisplayCard>}
          </div>

          {authCodes.length === 0 && <div className='flex-center flex-column'>
            <EmptyIcon description='No QR codes found. QR codes can be used to prove you own specific badges in-person.' />
          </div>}
        </>}
      </>}

      {tab == 'saved' && <>
        <>
          <br />

          <div className='flex-center'>
            {savedAuthCodes.length > 0 && <InformationDisplayCard md={12} xs={24} sm={24} title='' >

              <CustomCarousel
                title={<div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder' }}>My QR  Codes</div>}
                items={savedItems}
                showTotalMobile
              />
            </InformationDisplayCard>}
          </div>

          {savedAuthCodes.length === 0 && <div className='flex-center flex-column'>
            <EmptyIcon description='No QR codes saved.' />
          </div>}
        </>
      </>}
      <Divider />
    </Content>
    {/* //aign to bottom of page */}
    <div className='secondary-text' style={{ textAlign: 'center', margin: 16 }}>
      Looking to become an authentication provider and create / verify QR codes?

      Create <a onClick={() => { router.push('/auth/linkgen') }} target='_blank' rel="noreferrer" >here</a> or verify <a onClick={() => { router.push('/auth/verify') }} target='_blank' rel="noreferrer" >here</a>.
    </div>
  </>
  );
}

export default AuthCodes;