import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Divider, Empty, Row, Tooltip, Typography, notification } from "antd";
import { CollectionApprovalWithDetails, getAbbreviatedAddress } from "bitbadgesjs-utils";
import { useState } from "react";
import { QRCode } from 'react-qrcode-logo';

import { WEBSITE_HOSTNAME } from "../../constants";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";

export function CodesDisplay({
  approval,
  collectionId,
  codes,
  claimPassword,
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  collectionId: bigint,
  codes?: string[]
  claimPassword?: string
}) {

  const collection = useCollection(collectionId)

  const approvalCriteria = approval.approvalCriteria;
  const merkleChallenge = approvalCriteria ? approvalCriteria.merkleChallenge : undefined;

  const approvalId = approval.challengeTrackerId;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approvalId);

  const [codePage, setCodePage] = useState(1);

  const printStr = approval.details?.challengeDetails?.hasPassword ? 'password' : 'code';
  const urlSuffix = approval.details?.challengeDetails?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';
  const hasPassword = approval.details?.challengeDetails?.hasPassword;


  return <>

    <Row className='flex-center primary-text' style={{ textAlign: 'center', width: '100%' }}>

      <InformationDisplayCard md={12} xs={24} sm={24} title={hasPassword ? 'Password' : 'Codes'} subtitle={'Codes / passwords can either be entered manually by users on the claim page, or they can be given a unique URL containing the code to claim. URLs can also be navigated to using a QR code.'} >

        {!approval.details?.challengeDetails?.hasPassword && codes && codes.length > 0 && <>
          <br />
          <div style={{ color: '#FF5733' }}>
            <WarningOutlined /> Keep these codes safe and secure! Anyone with the code can claim the badge!
          </div>
          <br />
          <div>
            <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Download</Typography.Text>
            <br />
            <br />
            <div style={{ textAlign: 'center' }}>
              <div className="flex-center flex-wrap">
                <button
                  onClick={() => {
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadJson({
                      prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionId + '?approvalId=' + approvalId + '&code=ADD_CODE_HERE',
                      codes,
                      codeUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?approvalId=' + approvalId + '&code=' + x)
                    }, `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.json`);
                  }}
                  className="landing-button primary-text" style={{ width: 150 }}
                >
                  JSON File
                </button>
                <button
                  onClick={() => {
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                  }}
                  className="landing-button primary-text" style={{ width: 150 }}
                >
                  Codes .txt File
                </button>
                <button
                  onClick={() => {
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?approvalId=' + approvalId + '&code=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                  }}
                  className="landing-button primary-text" style={{ width: 150 }}
                >
                  URLs .txt File
                </button>
              </div>
              <br />
              <br />
              <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Copy</Typography.Text>
              <br />
              <br />
              <div className="flex-center flex-wrap">
                <button className="landing-button primary-text" style={{ width: 150 }}
                  onClick={() => {
                    navigator.clipboard.writeText(codes.join('\n'));
                    notification.success({
                      message: 'Copied!',
                      description: 'We have copied the codes to your clipboard.'
                    })
                  }}
                >
                  Copy Codes
                </button>
                <button className="landing-button primary-text" style={{ width: 150 }}
                  onClick={() => {
                    navigator.clipboard.writeText(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?approvalId=' + approvalId + '&code=' + x).join('\n'));
                    notification.success({
                      message: 'Copied!',
                      description: 'We have copied the URLs to your clipboard.'
                    })
                  }}
                >
                  Copy URLs
                </button>


              </div>
              <br />
              <div>
                Use a service like <a href="https://qrexplore.com/generate/" target="_blank" rel="noopener noreferrer">this QR code generator</a> to generate QR codes in batch for each unique URL.
              </div>
            </div>
            <Divider />
          </div>

          <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Individual</Typography.Text>

          <br />
        </>
        }
        {hasPassword && <div>
          <Divider />
          <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}> Password: {claimPassword}</Typography.Text>
        </div>}
        <br />
        <Pagination
          currPage={codePage}
          total={Number(codes?.length ?? 0n)}
          pageSize={1}
          onChange={(page) => {
            setCodePage(page);
          }}
        />


        <br />
        {!hasPassword && <><Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
          Code: <Tooltip color='black' title={`${codes?.[codePage - 1] ?? ''}`}>{getAbbreviatedAddress(codes?.[codePage - 1] ?? '')}</Tooltip>
        </Typography.Text>
          <br /><br />
          {merkleChallenge && !merkleChallenge.details?.challengeDetails?.hasPassword && !!merkleChallenge.maxUsesPerLeaf && codes && <Typography.Text strong className='secondary-text'>
            <InfoCircleOutlined /> Note that this code can only be used once.
            <br />
            <br />
            Current Status: {
              challengeTracker && (challengeTracker.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1) >= 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
            }
          </Typography.Text>}

          <br />
          <br />
        </>}
        <div className="flex-center flex-wrap">
          <button className="landing-button primary-text" style={{ width: 150 }}
            onClick={() => {
              console.log(navigator.clipboard && window.isSecureContext)

              navigator.clipboard.writeText((hasPassword ? claimPassword : codes?.[codePage - 1]) ?? '').catch(e => { console.error(e) });
              notification.success({
                message: 'Copied!',
                description: 'We have copied them to your clipboard.'
              })
            }}
          >
            Copy {printStr[0].toUpperCase() + printStr.slice(1)}
          </button>
          <Tooltip color="black" title={`${WEBSITE_HOSTNAME}/collections/${collectionId}?approvalId=${approvalId}&${urlSuffix}`}>
            <button className="landing-button primary-text" style={{ width: 150 }}
              onClick={() => {

                navigator.clipboard.writeText(`${WEBSITE_HOSTNAME}/collections/${collectionId}?approvalId=${approvalId}&${urlSuffix}`);
                notification.success({
                  message: 'Copied!',
                  description: 'We have copied the URL to your clipboard.'
                })
              }}
            >
              Copy URL
            </button>
          </Tooltip>

        </div>

        <br />
        <br />
        <div className="flex-center">
          <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collectionId}?approvalId=${approvalId}&${urlSuffix}`} /></div>
        <br />
      </InformationDisplayCard>
    </Row>

    {
      merkleChallenge && !merkleChallenge.details?.challengeDetails?.hasPassword && (!codes || codes.length === 0) &&
      <Empty
        description={<span className='primary-text'>There are no {printStr}s for this claim.</span>}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className='primary-text'
      />
    }
  </>
}