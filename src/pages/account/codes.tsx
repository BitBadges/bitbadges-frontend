import { Layout, Tooltip, Typography } from 'antd';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, BlockinAuthSignatureDoc, convertBlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { constructChallengeStringFromChallengeObject } from 'blockin';
import { useEffect, useState } from 'react';
import { deleteAuthCode, getAuthCode } from '../../bitbadges-api/api';
import { getAuthCodesView, updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
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

export const AuthCode = ({ authCode, setSavedAuthCodes, onlyShowDetails, savedAuthCodes, onlyShowCode, isPreview, notStoredInAccount, isExpected, onlyShowMetadata }: {
  savedAuthCodes?: BlockinAuthSignatureDoc<bigint>[],

  authCode: BlockinAuthSignatureDoc<bigint>, setSavedAuthCodes?:
  (codes: BlockinAuthSignatureDoc<bigint>[]) => void, onlyShowDetails?: boolean
  onlyShowCode?: boolean
  isPreview?: boolean,
  isExpected?: boolean,
  notStoredInAccount?: boolean,
  onlyShowMetadata?: boolean
}) => {
  const [currStatus, setCurrStatus] = useState({ success: false, verificationMessage: 'Loading...' });
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState('qr');
  const [tab, setTab] = useState(onlyShowDetails ? 'details' : 'code');


  useEffect(() => {
    (async () => {


      if (isPreview) {
        setCurrStatus({ success: true, verificationMessage: 'Preview: Successfully verified.' });
        setLoaded(true);
        return;
      }

      if (loaded || onlyShowCode) return;

      if (!authCode.signature) {
        setCurrStatus({ success: false, verificationMessage: 'No signature provided.' });
        setLoaded(true);
        return;
      }
      if (tab !== 'details') return;

      try {
        const res = await getAuthCode({ signature: authCode.signature, options: {} });
        setCurrStatus({ success: res.verification.success, verificationMessage: res.verification.response });
      } catch (e: any) {
        setCurrStatus({ success: false, verificationMessage: e.message });
      }
      setLoaded(true);
    })();
  }, [authCode.signature, loaded, onlyShowCode, isPreview, tab]);


  const validFrom = [{
    start: authCode.params.notBefore ? BigInt(new Date(authCode.params.notBefore).getTime()) : BigInt(1n),
    end: authCode.params.expirationDate ? BigInt(new Date(authCode.params.expirationDate).getTime()) : GO_MAX_UINT_64
  }]

  return <div className='flex-center flex-column full-width'>
    {!onlyShowDetails && <>
      <CollectionHeader
        codeDisplay
        collectionId={0n} //dummy value
        metadataOverride={{
          ...authCode,
        }}
        hideCollectionLink
        multiDisplay

      />
      <div className='flex-center flex-column full-width'>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
          {authCode.description}
        </div>
        {authCode.signature && <>
          {!onlyShowCode && <>
            <br />

            <div className='full-width'>
              <Tabs
                tab={tab}
                fullWidth
                setTab={setTab}
                tabInfo={[
                  { key: 'code', content: 'Code' },
                  { key: 'details', content: 'Details' }
                ]}
              />
            </div>
          </>}
          <br />
          {tab === 'code' && <>

            <div className='flex-center'>
              <Tabs
                tab={view}
                setTab={setView}
                tabInfo={[
                  { key: 'qr', content: 'QR Code' },
                  { key: 'text', content: 'Text' }
                ]}
                type='underline'
              />
            </div>
            <br />
            <QrCodeDisplay
              view={view}
              label={authCode.name}
              value={authCode.signature}
              setSavedAuthCodes={setSavedAuthCodes}
              savedAuthCodes={savedAuthCodes}
              authCode={authCode}
              helperDisplay={<div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                <WarningOutlined style={{ color: 'orange', marginRight: 8 }} /> Anyone with this code can authenticate as you. Keep it safe and secret.
                <br />
                <br />
                {notStoredInAccount ? <>
                  <div className='' style={{ textAlign: 'center', color: 'orange', fontSize: 16 }}>
                    <WarningOutlined style={{}} /> This code is only displayed once. It will not be stored in your BitBadges account. Please save it somewhere safe.
                  </div>
                </> : <>
                  <WarningOutlined style={{ color: 'orange', marginRight: 8 }} />  Codes are stored in your BitBadges account and can be accessed under the Authentication Codes page if signed in.
                  Note that signing in requires access to your crypto wallet. If you will not have access to your wallet at authentication time,
                  we recommend storing the code elsewhere.
                </>}

              </div>}

            />
          </>}
        </>
        }

      </div></>}
    {authCode.signature && tab === 'details' &&
      <InformationDisplayCard span={24} title='Status' inheritBg noBorder>
        <div className='secondary-text' style={{ fontSize: 16, textAlign: 'center', alignItems: 'center' }}>
          {currStatus.success ?
            <CheckCircleFilled style={{ color: 'green', marginRight: 8 }} />
            :
            <CloseCircleFilled style={{ color: 'red', marginRight: 8 }} />
          } {currStatus.verificationMessage}
        </div>
      </InformationDisplayCard>}
    {authCode.signature && tab === 'details' &&
      <InformationDisplayCard span={24} title='Message' inheritBg noBorder>
        <div className='secondary-text' style={{ fontSize: 16, textAlign: 'center', alignItems: 'center' }}>
          <Typography.Text className='secondary-text' copyable={{ text: constructChallengeStringFromChallengeObject(authCode.params) }}>
            Copy Original Message
          </Typography.Text>
        </div>
      </InformationDisplayCard>}
    {(!authCode.signature || tab === 'details') && !onlyShowMetadata &&
      <div className='full-width'>

        <InformationDisplayCard span={24} title={isExpected ? 'Expected Details' : "Details"} inheritBg noBorder>
          {/* const paramKeyOrder = [ 'statement', 'nonce', 'signature', 'description']; */}
          


          {authCode.signature && <TableRow label={'Code'} value={<Tooltip title={authCode.signature}><div style={{ float: 'right' }}>{getAbbreviatedAddress(authCode.signature)}</div></Tooltip>} labelSpan={8} valueSpan={16} />}
          {authCode.params.address && <TableRow label={'Address'} value={<div style={{ float: 'right' }}><AddressDisplay addressOrUsername={authCode.params.address} /></div>} labelSpan={8} valueSpan={16} />}
          <TableRow label={'Domain'} value={<a href={authCode.params.domain} target='_blank' rel="noreferrer">{authCode.params.domain}</a>} labelSpan={8} valueSpan={16} />
          {authCode.params.uri !== authCode.params.domain && <TableRow label={'URI'} value={<a href={authCode.params.uri} target='_blank' rel="noreferrer">{authCode.params.uri}</a>} labelSpan={8} valueSpan={16} />}
          <TableRow label={'Statement'} value={authCode.params.statement} labelSpan={8} valueSpan={16} />
          {!!authCode.createdAt && <TableRow label={'Issued At'} value={new Date(Number(authCode.createdAt)).toLocaleString()} labelSpan={8} valueSpan={16} />}
          {<TableRow label={'Authenticated Times'} value={<>{getTimeRangesElement(validFrom)}
            {BigInt(Date.now()) < validFrom[0].start || BigInt(Date.now()) > validFrom[0].end ? <CloseCircleFilled style={{ color: 'red', marginLeft: 8 }} /> : <CheckCircleFilled style={{ color: 'green', marginLeft: 8 }} />}
          </>} labelSpan={8} valueSpan={16} />}

          <TableRow label={'Randomness'} value={authCode.params.nonce} labelSpan={8} valueSpan={16} />
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

      </div>}
  </div>
}

export function AuthCodes() {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState(false);
  const [authCodes, setAuthCodes] = useState<BlockinAuthSignatureDoc<bigint>[]>([]);

  useEffect(() => {
    if (!signedInAccount) return;

    console.log("new auth codes", getAuthCodesView(signedInAccount, 'authCodes'));
    setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
  }, [signedInAccount]);

  const [tab, setTab] = useState('all');
  const [savedAuthCodes, setSavedAuthCodes] = useState<BlockinAuthSignatureDoc<bigint>[]>([]);

  const getItems = (codes: BlockinAuthSignatureDoc<bigint>[]) => {
    return codes.map((authCode) => {
      if (!authCode) return <></>;
      return <div className='full-width' key={authCode.signature}>
        <AuthCode authCode={authCode} savedAuthCodes={savedAuthCodes} setSavedAuthCodes={setSavedAuthCodes} />
        <Divider />
        <div className='flex-center'>
          <IconButton
            src={<DeleteOutlined />}
            text='Delete'
            disabled={loading}
            onClick={async () => {
              if (!signedInAccount) return;


              setLoading(true);
              if (confirm('Are you sure you want to delete this code?')) {
                if (signedInAccount.views.authCodes?.ids.includes(authCode._docId)) {
                  await deleteAuthCode({ signature: authCode.signature });
                }
              } else {
                return
              }
              setLoading(false);

              const existingAuthCodes = localStorage.getItem('savedAuthCodes');
              const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
              const newAuthCodes = authCodes.filter((y: any) => y.signature !== authCode.signature);
              localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));

              console.log("UPDATING acc", {
                ...signedInAccount,
                views: {
                  ...signedInAccount.views,
                  authCodes: signedInAccount.views.authCodes ? {
                    ...signedInAccount.views.authCodes,
                    ids: signedInAccount.authCodes.map(x => x._docId).filter(x => x !== authCode._docId),
                  } : undefined
                }
              });

              await updateAccount({
                ...signedInAccount,
                views: {
                  ...signedInAccount.views,
                  authCodes: signedInAccount.views.authCodes ? {
                    ...signedInAccount.views.authCodes,
                    ids: signedInAccount.authCodes.map(x => x._docId).filter(x => x !== authCode._docId),
                  } : undefined
                }
              }, true);
            }}
            tooltipMessage='Delete this code'
          />
        </div>
      </div>
    });
  }


  useEffect(() => {
    //Check local storage
    const savedAuthCodes = localStorage.getItem('savedAuthCodes');
    if (savedAuthCodes) {
      setSavedAuthCodes(JSON.parse(savedAuthCodes).map((x: any) => convertBlockinAuthSignatureDoc(x, BigIntify)));
    }
  }, []);

  const items = getItems(authCodes);
  const savedItems = getItems(savedAuthCodes);

  return (<>
    <Content
      className="full-area"
      style={{ minHeight: '80vh', padding: 8 }}
    >
      <br />



      <br />
      {tab == 'all' && <>
        {!signedInAccount || !chain.loggedIn ? <>
          <div className='flex-center flex-column'>
            <BlockinDisplay />
          </div>
        </> : <>
          <br />

          <div className='flex-center'>
            {<InformationDisplayCard md={12} xs={24} sm={24} title='' >

              <CustomCarousel
                title={<div className='flex'>

                  <Tabs
                    tab={tab}
                    setTab={setTab}
                    tabInfo={[
                      { key: 'all', content: 'All' + (authCodes.length > 0 ? ` (${authCodes.length})` : ' (0)') },
                      { key: 'saved', content: 'Saved' + (savedAuthCodes.length > 0 ? ` (${savedAuthCodes.length})` : ' (0)') }
                    ]}
                  />
                </div>}
                items={items}
                numPerPage={1}
              />
              {authCodes.length === 0 && <div className='flex-center flex-column'>
                <EmptyIcon description='No codes found. Providers will give you instructions on how to create one.' />
              </div>}
            </InformationDisplayCard>}
          </div>


        </>}
      </>}

      {tab == 'saved' && <>
        <>
          <br />
          <div className='flex-center'>
            {<InformationDisplayCard md={12} xs={24} sm={24} title='' >

              <CustomCarousel
                title={<div className='flex-center'>

                  <Tabs
                    tab={tab}
                    setTab={setTab}
                    tabInfo={[
                      { key: 'all', content: 'All' + (authCodes.length > 0 ? ` (${authCodes.length})` : ' (0)') },
                      { key: 'saved', content: 'Saved' + (savedAuthCodes.length > 0 ? ` (${savedAuthCodes.length})` : ' (0)') }
                    ]}
                  />
                </div>}
                items={savedItems}
                numPerPage={1}
              />
              {savedAuthCodes.length === 0 && <div className='flex-center flex-column'>
                <EmptyIcon description='No codes saved to the browser.' />
              </div>}
            </InformationDisplayCard>}
          </div>


        </>
      </>}
      <Divider />
    </Content>

  </>
  );
}

export default AuthCodes;