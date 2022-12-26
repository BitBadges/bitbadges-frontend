import { NextApiRequest, NextApiResponse } from "next";
import { create } from 'ipfs-http-client'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import last from 'it-last';

const auth =
    'Basic ' + Buffer.from(process.env.INFURA_ID + ':' + process.env.INFURA_SECRET_KEY).toString('base64');

const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

const addToIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log(process.env.INFURA_ID);
    console.log(req.body);
    console.log(JSON.stringify(req.body));

    const files = [];
    files.push({
        path: 'metadata/collection',
        content: uint8ArrayFromString(JSON.stringify(req.body.collectionMetadata))
    });

    console.log(files);

    let individualBadgeMetadata = req.body.individualBadgeMetadata;
    for (let i = 0; i < individualBadgeMetadata.length; i++) {
        files.push(
            {
                path: 'metadata/' + i,
                content: uint8ArrayFromString(JSON.stringify(individualBadgeMetadata[i]))
            }
        );
    }


    const result = await last(client.addAll(files));

    if (!result) {
        return res.status(400).send({ error: 'No addAll result received' });
    }

    console.log(result);

    const { path, cid } = result;
    return res.status(200).send({ cid: cid.toString(), path });
};

export default addToIpfs;

