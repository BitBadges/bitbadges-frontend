import { NextApiRequest, NextApiResponse } from "next";
import { create } from 'ipfs-http-client'

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


export const getFromIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    const getRes = client.get(req.body.cid + '/' + req.body.path);

    const decoder = new TextDecoder();
    let fileJson = '';
    for await (const file of getRes) {
        let chunk = decoder.decode(file);
        fileJson += chunk;
    }

    return res.status(200).send({ file: fileJson });
}

export default getFromIpfs;
