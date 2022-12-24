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

const addToIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log(process.env.INFURA_ID);
    console.log(req.body);
    console.log(JSON.stringify(req.body));

    const { cid, path } = await client.add(JSON.stringify(req.body))


    return res.status(200).send({ cid, path });
};

export default addToIpfs;

