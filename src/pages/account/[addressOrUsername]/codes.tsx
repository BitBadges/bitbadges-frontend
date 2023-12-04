import { Avatar, Layout, Tooltip, notification } from 'antd';
import 'react-markdown-editor-lite/lib/index.css';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleFilled, WarningOutlined } from '@ant-design/icons';
import { BlockinAuthSignatureInfo, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { toDataURL } from 'qrcode';
import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { deleteAuthCode, getAuthCode } from '../../../bitbadges-api/api';
import { getAuthCodesView, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../../components/address/AddressDisplay';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
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

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `blockin-qr-code-${x.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (imageUrl: string) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;

        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);

        notification.info({
          message: 'Copied to clipboard',
          description: 'The QR code has been copied to your clipboard. You can now paste it anywhere.'
        })
      });
    };
    img.src = imageUrl;
  }

  return <div className='flex-center flex-column full-width'>
    <CollectionHeader
      collectionId={1n} //dummy value
      metadataOverride={{
        ...x,
      }}
      hideCollectionLink
    />
    <div className='flex-center flex-column'>
      <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
        {x.description}
      </div>
      <br />
      {x.signature && <>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
          <Avatar shape='square' size={276} src={
            <QRCode value={x.signature} size={256} />
          }></Avatar>
        </div>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
          <WarningOutlined style={{ color: 'orange', marginRight: 8 }} /> Anyone with this QR code can authenticate as you. Keep it safe and secret.
          <br />
          <br />
          <InfoCircleFilled style={{ marginRight: 8 }} /> We strongly recommend storing this QR code elsewhere for easier presentation at authentication time.
          Otherwise, ensure you are logged into your BitBadges account (if not, you will need another wallet signature to authenticate).
        </div>
        <Divider />
      </>
      }
    </div>
    {x.signature && <>
      <div className='flex-center flex-wrap'>
        <button className='landing-button' style={{ minWidth: 130 }} onClick={async () => {
          const imageUrl = await toDataURL(x.signature);
          handleDownload(imageUrl);
        }}>
          Save As Image
        </button>
        <button className='landing-button' style={{ minWidth: 130 }} onClick={async () => {
          const imageUrl = await toDataURL(x.signature);
          handleCopy(imageUrl);
        }}>
          Copy As Image
        </button>
        {/* //Share as PNG */}
        {navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] }) &&
          <button className='landing-button' style={{ minWidth: 130 }} onClick={async () => {
            const imageUrl = await toDataURL(x.signature);
            navigator.share({
              files: [new File([imageUrl], 'blockin-qr-code.png', { type: 'image/png' })],
              title: 'Blockin QR Code',
              text: 'Blockin QR Code',
            });
          }}>
            Share
          </button>
        }
      </div>
    </>}
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
  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState(false);
  // const [tab, setTab] = useState('codes');
  const tab = 'codes';
  const [authCodes, setAuthCodes] = useState(getAuthCodesView(signedInAccount, 'authCodes'));

  useEffect(() => {
    setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
  }, [signedInAccount]);

  const items = authCodes.map((x) => {
    if (!x) return <></>;
    return <div className='full-width' key={x.signature}>
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
    </div>
  });



  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect and sign in to view this page.'}
      node={
        <Content
          className="full-area"
          style={{ minHeight: '100vh', padding: 8 }}
        >
          <br />
          {signedInAccount && tab === 'codes' && <>
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
              <EmptyIcon description='No QR codes found. Authentication providers will give you the custom link to generate a QR code for authentication.' />
            </div>}
          </>}
          <Divider />
          <div className='secondary-text flex-center'>
            Looking to become an authentication provider and create / verify QR codes? See{' '}<a style={{ marginLeft: 3 }} href='https://docs.bitbadges.io/for-developers/generating-auth-qr-codes' target='_blank' rel="noreferrer">the documentation here</a>.
          </ div>
        </ Content>
      }
    />
  );
}

export default AuthCodes;