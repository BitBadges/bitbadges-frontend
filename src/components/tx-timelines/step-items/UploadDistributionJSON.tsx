import { Input } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { Claims, Transfers } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { getWrappedClaims, getWrappedTransfers } from "bitbadgesjs-proto/dist/messages/bitbadges/badges/typeUtils";

export function UploadJSONStepItem(
  newCollectionMsg: MessageMsgNewCollection,
  setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
) {
  const [distributionJSON, setDistributionJSON] = useState<string>('');
  const [valid, setValid] = useState<boolean>(false);

  useEffect(() => {
    try {
      console.log(distributionJSON);
      console.log(distributionJSON.slice(90));
      const distribution: {
        claims: Claims[],
        transfers: Transfers[]
      } = JSON.parse(distributionJSON);
      console.log(distribution);

      if (!distribution.claims || !distribution.transfers) {
        setValid(false);
        return;
      }

      // balances: Balance[];
      // codeRoot: string;
      // whitelistRoot: string;
      // uri: string;
      // timeRange: IdRange;
      // restrictOptions: number;
      // amount: number;
      // badgeIds: IdRange[];
      // incrementIdsBy: number;
      // expectedMerkleProofLength: number;



      let claims = getWrappedClaims(distribution.claims).map(claim => claim.toObject()) as Claims[];
      let transfers = getWrappedTransfers(distribution.transfers).map(transfer => transfer.toObject()) as Transfers[];
      console.log(claims, distribution.claims, distribution.transfers, transfers);


      /*
      {
        "transfers": [{
        "balances": [{
        "balance": 1,
        "badgeIds": [{
        "start": 1,
        "end": 1
        }]
        }],
        "toAddresses": [1]
        }],
          "claims" : []
        }
      */

      setNewCollectionMsg({
        ...newCollectionMsg,
        claims: claims,
        transfers: transfers
      });

      setValid(true);
    } catch (e) {
      console.error(e);
      setValid(false);
      return;
    }
  }, [distributionJSON]);

  return {
    title: 'Upload Distribution JSON',
    description: `Manually upload the distribution JSON file. Often used with distribution tools.`,
    node: <div style={{ color: PRIMARY_TEXT, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%' }}>
        <Input.TextArea
          rows={10}
          value={distributionJSON}
          onChange={(e) => setDistributionJSON(e.target.value)}
          placeholder="Paste JSON here"
          style={{ width: '100%', color: PRIMARY_TEXT, background: PRIMARY_BLUE }}
        />
      </div>
    </div>,
    disabled: !valid,
  }
}