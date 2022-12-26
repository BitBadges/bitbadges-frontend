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

    const testFiles = Array.from(Array(10), (_, i) => {
        if (i === 9) {
            return {
                path: 'metadata/collection',
                content: uint8ArrayFromString(JSON.stringify(req.body))
            }
        }


        return {
            path: 'metadata/' + i,
            content: uint8ArrayFromString(JSON.stringify({
                ...req.body,
                name: req.body.name + ' w/ ID: ' + i,
            }))
        }
    });


    const result = await last(client.addAll(testFiles));

    if (!result) {
        return res.status(400).send({ error: 'No addAll result received' });
    }

    console.log(result);

    const { path, cid } = result;
    return res.status(200).send({ cid: cid.toString(), path });
};

export default addToIpfs;

