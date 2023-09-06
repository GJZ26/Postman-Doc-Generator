import express from "express";
import bodyParser from "body-parser";
import cors from 'cors'
import { CollectionReader } from "./src/modules/collectionReader.js";

const app = express();
const rdr = new CollectionReader(false)

app.use(express.static(process.cwd()+"/src/public"))
app.use(bodyParser.json())
app.use(cors())

app.get("/", (req, res) => {
    res.sendFile(process.cwd()+"/src/views/general.html")
})

app.post("/test",(req,res)=>{
    rdr.analize(req.body.file);
    const info = rdr.saveHTML();
    console.log(info)
    res.send({uri:info})
})

app.listen(3000, () => {
    console.log("http://127.0.0.1:3000/")
})