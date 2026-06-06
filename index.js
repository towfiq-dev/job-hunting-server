const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("job-hunting-server");
    const jobCollection = db.collection("newJobs");
    const companyCollection = db.collection("companies");

    // post
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.json(result);
    });

    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const result = await companyCollection.insertOne(company);
      res.send(result);
    });

    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollection.findOne(query);

      res.send(result || {});
    });

    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }

      const cursor = jobCollection.find(query);
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running on port");
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
