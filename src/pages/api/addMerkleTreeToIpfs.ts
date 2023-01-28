import { NextApiRequest, NextApiResponse } from "next";
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import last from 'it-last';
import { ipfsClient } from "./ipfs";


const addMerkleTreeToIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    const files = [];
    files.push({
        path: '',
        content: uint8ArrayFromString(JSON.stringify(req.body.leaves))
    });

    const result = await last(ipfsClient.addAll(files));

    if (!result) {
        return res.status(400).send({ error: 'No addAll result received' });
    }

    const { path, cid } = result;
    return res.status(200).send({ cid: cid.toString(), path });
};

export default addMerkleTreeToIpfs;

