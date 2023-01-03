import { NextApiRequest, NextApiResponse } from "next";
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import last from 'it-last';
import { ipfsClient } from "./ipfs";


const addToIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    const files = [];
    files.push({
        path: 'metadata/collection',
        content: uint8ArrayFromString(JSON.stringify(req.body.collectionMetadata))
    });

    console.log("req.body for addToIPFS: " + JSON.stringify(req.body));
    let individualBadgeMetadata = req.body.individualBadgeMetadata;
    for (let i = 0; i < individualBadgeMetadata.length; i++) {
        files.push(
            {
                path: 'metadata/' + i,
                content: uint8ArrayFromString(JSON.stringify(individualBadgeMetadata[i]))
            }
        );
    }

    const result = await last(ipfsClient.addAll(files));

    if (!result) {
        return res.status(400).send({ error: 'No addAll result received' });
    }

    const { path, cid } = result;
    return res.status(200).send({ cid: cid.toString(), path });
};

export default addToIpfs;

