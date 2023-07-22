
export function TransferabilitySelectStepItem() {
  // const [handledTransfers, setHandledTransfers] = useState(false);

  return {
    title: `Select Transferability`,
    description: `Note that transferability only applies to the transferring of distributed badges, not the minting or claiming process.`,
    // node: <TransfersMappingSelect
    //   setHandled={() => setHandledTransfers(true)}
    // />,
    node: <div>TODO</div>,
    // disabled: !handledTransfers
  }
}