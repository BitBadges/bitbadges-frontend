import { Layout, Tooltip } from 'antd';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, BlockinAuthSignatureDoc, convertBlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-utils';
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


  const validFrom = [{
    start: authCode.params.notBefore ? BigInt(new Date(authCode.params.notBefore).getTime()) : BigInt(authCode.createdAt),
    end: authCode.params.expirationDate ? BigInt(new Date(authCode.params.expirationDate).getTime()) : GO_MAX_UINT_64
  }]

  return <div className='flex-center flex-column full-width'>
    <CollectionHeader
      collectionId={0n} //dummy value
      metadataOverride={{
        ...authCode,
      }}
      hideCollectionLink
      multiDisplay

    />
    <div className='flex-center flex-column'>
      <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
        {authCode.description}
      </div>
      <QrCodeDisplay
        label={authCode.name}
        value={authCode.signature}
        storeLocally={storeLocally}
        authCode={authCode}
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
    {authCode.signature &&
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
        {authCode.signature && <TableRow label={'ID'} value={<Tooltip title={authCode.signature}><div style={{ float: 'right' }}>{getAbbreviatedAddress(authCode.signature)}</div></Tooltip>} labelSpan={8} valueSpan={16} />}
        <TableRow label={'Address'} value={<div style={{ float: 'right' }}><AddressDisplay addressOrUsername={authCode.params.address} /></div>} labelSpan={8} valueSpan={16} />
        <TableRow label={'Domain'} value={<a href={authCode.params.domain} target='_blank' rel="noreferrer">{authCode.params.domain}</a>} labelSpan={8} valueSpan={16} />
        {authCode.params.uri !== authCode.params.domain && <TableRow label={'URI'} value={<a href={authCode.params.uri} target='_blank' rel="noreferrer">{authCode.params.uri}</a>} labelSpan={8} valueSpan={16} />}
        <TableRow label={'Statement'} value={authCode.params.statement} labelSpan={8} valueSpan={16} />
        <TableRow label={'Issued At'} value={new Date(Number(authCode.createdAt)).toLocaleString()} labelSpan={8} valueSpan={16} />
        <TableRow label={'Valid From'} value={<>{getTimeRangesElement(validFrom)}
          {BigInt(Date.now()) < validFrom[0].start || BigInt(Date.now()) > validFrom[0].end ? <CloseCircleFilled style={{ color: 'red', marginLeft: 8 }} /> : <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />}
        </>} labelSpan={8} valueSpan={16} />

        <TableRow label={'Nonce'} value={authCode.params.nonce} labelSpan={8} valueSpan={16} />
        {authCode.params.chainId && <TableRow label={'Chain ID'} value={authCode.params.chainId} labelSpan={8} valueSpan={16} />}
        {authCode.params.version && <TableRow label={'Version'} value={authCode.params.version} labelSpan={8} valueSpan={16} />}
        {authCode.params.resources && !!authCode.params.resources.length ? <TableRow label={'Resources'} value={authCode.params.resources.join(', ')} labelSpan={8} valueSpan={16} /> : <></>}
        {authCode.params.assets && !!authCode.params.assets.length ? <TableRow label={'Ownership Requirements'} value={authCode.params.assets.map((asset, i) => {
          const chainName = asset.chain;

          return <div key={i}>
            For {asset.mustSatisfyForAllAssets ? 'all' : 'one'} of the specified assets ({asset.assetIds.map((assetId, index) => {
              if (typeof assetId !== 'object') {
                return <>{"ID: " + assetId.toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
              } else {
                if (assetId.start === assetId.end) {
                  return <>ID {BigInt(assetId.start).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
                }
                return <>IDs {BigInt(assetId.start).toString()}-{BigInt(assetId.end).toString()}{index !== asset.assetIds.length - 1 ? ', ' : ''}</>
              }
            })}), you must own {[asset.mustOwnAmounts].map(amount => {
              if (typeof amount !== 'object') {
                return 'x' + BigInt(amount).toString();
              } else {
                if (amount.start === amount.end) {
                  return `x${BigInt(amount.start).toString()}`
                }
                return `x${BigInt(amount.start).toString()}-${BigInt(amount.end).toString()}`
              }
            }).join(', ')} from {chainName + " Collection: " + asset.collectionId.toString()} {asset.ownershipTimes ? 'from ' +
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

        })} labelSpan={8} valueSpan={16} /> : <></>}
      </InformationDisplayCard>

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

  const getItems = (codes: BlockinAuthSignatureDoc<bigint>[], saved?: boolean) => {
    return codes.map((authCode) => {
      if (!authCode) return <></>;
      return <div className='full-width' key={authCode.signature}>
        <AuthCode authCode={authCode} storeLocally={!saved} />
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
                await deleteAuthCode({ signature: authCode.signature });
                window.location.reload();
              }
              setLoading(false);
            } else {
              const existingAuthCodes = localStorage.getItem('savedAuthCodes');
              const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
              const newAuthCodes = authCodes.filter((y: any) => y.signature !== authCode.signature);
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
      {/* <div className="primary-text" style={{ fontSize: 25, textAlign: 'center' }}>
        Authentication QR Codes
      </div>
      <div className='secondary-text' style={{ textAlign: 'center' }}>
        Authentication QR codes can be used to prove you own specific badges in-person.
        Looking to become an authentication provider? See  <a onClick={() => { router.push('https://docs.bitbadges.io/overview/verification-tools') }} target='_blank' rel="noreferrer" >here</a>.
      </div>
      <Divider /> */}
      <div className='flex-center'>

        <Tabs
          tab={tab}
          setTab={setTab}
          tabInfo={[
            { key: 'all', content: 'All' },
            { key: 'saved', content: 'Browser' }
          ]}
        />
      </div>
      <div className='secondary-text' style={{ textAlign: 'center' }}>
        <InfoCircleOutlined /> {tab == 'all' ? 'QR codes for this account stored by BitBadges servers.' : 'QR codes you have saved to the browser on this device.'}
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
                numPerPage={1}
                showTotalMobile
              />
            </InformationDisplayCard>}
          </div>

          {authCodes.length === 0 && <div className='flex-center flex-column'>
            <EmptyIcon description='No QR codes found. Providers will give you instructions on how to create one.' />
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
                numPerPage={1}
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

  </>
  );
}

export default AuthCodes;