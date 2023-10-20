import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Divider, Empty, Row, Tooltip, Typography } from "antd";
import { CollectionApprovalWithDetails, getAbbreviatedAddress } from "bitbadgesjs-utils";
import { useState } from "react";
import { QRCode } from 'react-qrcode-logo';
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { WEBSITE_HOSTNAME } from "../../constants";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { Pagination } from "../common/Pagination";
import { ToolIcon, tools } from "../display/ToolIcon";
import { InformationDisplayCard } from "../display/InformationDisplayCard";

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
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId)

  const approvalCriteria = approval.approvalCriteria;
  const merkleChallenge = approvalCriteria ? approvalCriteria.merkleChallenge : undefined;

  const claimId = approval.challengeTrackerId;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === claimId);

  const [codePage, setCodePage] = useState(1);

  const printStr = merkleChallenge?.details?.challengeDetails?.hasPassword ? 'password' : 'code';
  const urlSuffix = merkleChallenge?.details?.challengeDetails?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';
  const hasPassword = merkleChallenge?.details?.challengeDetails?.hasPassword;
  return <Card
    className="primary-text inherit-bg"
    style={{
      // margin: 8,
      textAlign: 'center',
      border: 'none',
      overflowWrap: 'break-word',
    }}

  >

    {/* // Show authenticated manager information (passwords, codes, distribution methods, etc...) */}

    <div>
      {"There are multiple ways to distribute. Select the option that best suits your needs. Keep these codes safe and secure! Anyone with the code can claim the badge."}
    </div>
    <br />
    <Row className='flex' style={{ textAlign: 'center', width: '100%' }}>

      <InformationDisplayCard md={12} xs={24} sm={24} title={hasPassword ? 'Password' : 'Codes'} subtitle={'Codes / passwords can either be entered manually by users on the claim page, or they can be given a unique URL containing the code to claim. URLs can also be navigated to using a QR code.'} >

        {!merkleChallenge?.details?.challengeDetails?.hasPassword && codes && codes.length > 0 && <>
          <br />
          <div>
            <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Download</Typography.Text>
            <br />
            <br />
            <div style={{ textAlign: 'center' }}>
              <div className="flex-center flex-wrap">
                <button
                  onClick={() => {
                    alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadJson({
                      prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=ADD_CODE_HERE',
                      codes,
                      codeUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x)
                    }, `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.json`);
                  }}
                  className="landing-button primary-text" style={{ width: 150 }}
                >
                  JSON File
                </button>
                <button
                  onClick={() => {
                    alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
                  }}
                  className="landing-button primary-text" style={{ width: 150 }}
                >
                  Codes .txt File
                </button>
                <button
                  onClick={() => {
                    alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                    const today = new Date();

                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                    downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
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
                    alert('We will now copy the codes to your clipboard.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                    navigator.clipboard.writeText(codes.join('\n'));
                  }}
                >
                  Copy Codes
                </button>
                <button className="landing-button primary-text" style={{ width: 150 }}
                  onClick={() => {
                    alert('We will now copy the code URLs to your clipboard.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                    navigator.clipboard.writeText(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n'));
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
              alert('We will now copy the code / password to your clipboard.\n\nWARNING: Your badges can be redeemed by anyone who has this. Please keep this in safe hands and only give it to trusted parties!');
              navigator.clipboard.writeText((hasPassword ? claimPassword : codes?.[codePage - 1]) ?? '').catch(e => { console.error(e) });
            }}
          >
            Copy {printStr[0].toUpperCase() + printStr.slice(1)}
          </button>
          <Tooltip color="black" title={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`}>
            <button className="landing-button primary-text" style={{ width: 150 }}
              onClick={() => {
                alert('We will now copy the URL to your clipboard.\n\nWARNING: Your badges can be redeemed by anyone who has this. Please keep this in safe hands and only give it to trusted parties!');
                navigator.clipboard.writeText(`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`);
              }}
            >
              Copy URL
            </button>
          </Tooltip>

        </div>

        <br />
        <br />
        <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`} />
        <br />
      </InformationDisplayCard>

      <InformationDisplayCard md={12} xs={24} sm={24} title={'Distribution'} subtitle={'You can distribute via your preferred method. You may find some of the tools below helpful.'} >
        <div>
          <br />
          <div>
            <WarningOutlined style={{ color: 'orange', marginRight: 4 }} />
            {"Some of these are third-party tools. Use at your own risk."}
          </div>
          <br />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {tools.map((tool, idx) => {
              if (tool.toolType !== "Distribution" || tool.native) return <></>

              return <div style={{
                margin: 8, display: 'flex'
              }} key={idx}>
                <ToolIcon
                  name={tool.name
                  }
                />
              </div>
            })}
          </div>
        </div>
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
  </Card >
}