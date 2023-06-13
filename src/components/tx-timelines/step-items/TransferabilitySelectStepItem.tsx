import { useState } from "react";
import { TransfersMappingSelect } from "../form-items/TransfersMappingSelect";

export function TransferabilitySelectStepItem() {
  const [handledTransfers, setHandledTransfers] = useState(false);

  return {
    title: `Select Transferability`,
    description: `Note that transferability only applies to the transferring of distributed badges, not the minting or claiming process.`,
    node: <TransfersMappingSelect
      setHandled={() => setHandledTransfers(true)}
    />,
    disabled: !handledTransfers
  }
}