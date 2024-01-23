import { Layout, Tooltip, Typography } from 'antd';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { BigIntify, BitBadgesAddressList, BlockinAuthSignatureDoc, convertBlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { AndGroup, AssetConditionGroup, OrGroup, OwnershipRequirements, createChallenge } from 'blockin';
import { useEffect, useState } from 'react';
import { deleteAuthCode, getAddressLists, getAuthCode } from '../../bitbadges-api/api';
import { getAuthCodesView, updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections } from '../../bitbadges-api/contexts/collections/CollectionsContext';
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
import { AssetConditionGroupUI } from '../auth/codegen';


const { Content } = Layout;

export const AuthCode = ({
  ported,
  authCode, setSavedAuthCodes, onlyShowDetails, savedAuthCodes, onlyShowCode, isPreview, notStoredInAccount, isExpected, onlyShowMetadata }: {
    savedAuthCodes?: BlockinAuthSignatureDoc<bigint>[],
    ported?: boolean,

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
  const [lists, setLists] = useState<BitBadgesAddressList<bigint>[]>([]);


  useEffect(() => {
    function getCollectionIds(assetConditionGroup: AssetConditionGroup<bigint>, collectionIds: bigint[], listIds: string[] = []) {
      const andItem = assetConditionGroup as AndGroup<bigint>;
      const orItem = assetConditionGroup as OrGroup<bigint>;
      const normalItem = assetConditionGroup as OwnershipRequirements<bigint>;

      if (andItem.$and) {
        for (const item of andItem.$and) {
          getCollectionIds(item, collectionIds, listIds);
        }
      } else if (orItem.$or) {
        for (const item of orItem.$or) {
          getCollectionIds(item, collectionIds, listIds);
        }
      } else {
        for (const asset of normalItem.assets) {
          if (asset.collectionId) {
            if (asset.collectionId === 'BitBadges Lists') {
              listIds.push(asset.assetIds[0] as string);
            } else {
              collectionIds.push(BigInt(asset.collectionId));
            }
          }
        }
      }

    }


    const listIds: string[] = [];
    const collectionIdsToFetch: bigint[] = [];
    if (authCode.params?.assetOwnershipRequirements) {
      getCollectionIds(authCode.params?.assetOwnershipRequirements ?? {}, collectionIdsToFetch, listIds);
    }


    if (collectionIdsToFetch.length) {
      fetchCollections(collectionIdsToFetch);
    }

    if (listIds.length) {
      getAddressLists({ listsToFetch: listIds.map(x => { return { listId: x } }) }).then(lists => {
        setLists(lists.addressLists);
      })
    }
  }, [authCode.params]);

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

        setCurrStatus({
          success: res.verificationResponse.success, verificationMessage:
            res.verificationResponse.success ? 'Successfully verified.' : res.verificationResponse.errorMessage ?? ''
        });
      } catch (e: any) {
        console.log("ERR", e);
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
                {!ported && <>
                  <br />
                  <br />
                  {notStoredInAccount ? <>
                    <div className='' style={{ textAlign: 'center', color: 'orange', fontSize: 16 }}>
                      <WarningOutlined style={{}} /> This code is only displayed once. It will not be stored in your BitBadges account. Please save it somewhere safe.
                    </div>
                  </> : <>
                    <WarningOutlined style={{ color: 'orange', marginRight: 8 }} />  This code is stored in your BitBadges account and can be accessed under the Authentication Codes page if signed in.
                    Note that signing in requires access to your crypto wallet. If you will not have access to your wallet at authentication time,
                    we recommend storing the code elsewhere.
                  </>}
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
          <Typography.Text className='secondary-text' copyable={{ text: createChallenge(authCode.params) }}>
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
          {authCode.params.assetOwnershipRequirements && <>
            <TableRow label={'Ownership Requirements'} value={<></>} labelSpan={24} valueSpan={0} />
            <TableRow label={<div className='my-4'>

              <AssetConditionGroupUI
                assetConditionGroup={authCode.params.assetOwnershipRequirements}
                bulletNumber={1}
                parentBullet={1}
                lists={lists}
                address={authCode.params.address}
              />
            </div>} value={<></>} labelSpan={24} valueSpan={0} />


          </>}
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