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
    console.log("TESTING");
    console.log(cid);
    console.log(path);
    const getRes = client.cat(path)
    console.log(getRes)

    const decoder = new TextDecoder()


    for await (const file of getRes) {
        console.log(file)
        console.log("CHUNK", decoder.decode(file))

        // console.log(JSON.parse(file.toString()));

        // console.log(JSON.stringify(file))
        // console.log(Buffer.from(JSON.stringify(file)));
    }

    return res.status(200).send({ cid, path });
};

export default addToIpfs;
