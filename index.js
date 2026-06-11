const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // const db = client.db("job-hunting-server");
    // const jobCollection = db.collection("newJobs");
    // const companyCollection = db.collection("companies");
    // const userCollection = db.collection("user");
    // const applicationsCollection = db.collection("applicantUser");
    // const planCollection = db.collection('plans')
    // const subscriptionCollection = db.collection('Subscriptions')
    const db = client.db("job-hunting-server");
    const jobCollection = db.collection("newJobs");
    const companyCollection = db.collection("companies");
    const applicationsCollection = db.collection("applicantUser");
    const planCollection = db.collection("plans");
    const subscriptionCollection = db.collection("Subscriptions");
    const userCollection = db.collection("user");
    // const userDb = client.db("job-hunting-platform");

    //   app.get('/api/plans', async(req, res)=>{
    //     const query = {}
    //     if (req.query.plan_id) {
    //       query.id = req.query.plan_id
    //     }
    // //     if (req.query.plan_id) {
    // //   query.planId = req.query.plan_id
    // // }
    //     const plan = await planCollection.findOne(query)
    //     res.json(plan)
    //   })

    // plans
    // app.get('/api/plans', async (req, res) => {
    //     const query = {}
    //     if (req.query.plan_id) {
    //         query.id = req.query.plan_id
    //     }
    //     const plan = await planCollection.findOne(query);
    //     res.json(plan)
    // })

    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      } else {
        // plan_id না থাকলে default free plan দাও
        query.id = "seeker_free";
      }
      const plan = await planCollection.findOne(query);

      // তারপরও null হলে hardcode করে free plan পাঠাও
      if (!plan) {
        return res.json({
          id: "seeker_free",
          name: "Free",
          maxApplicationsPerMonth: 3,
        });
      }

      res.json(plan);
    });

    // post
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date(),
      };
      const result = await jobCollection.insertOne(newJob);
      res.json(result);
    });

    // subscription
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date(),
      };

      const result = await subscriptionCollection.insertOne(subsInfo);

      // update the user plan information
      const filter = { email: data.email };
      // update the value of the 'quantity' field to 5
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };

      const updateResult = await userCollection.updateOne(
        filter,
        updateDocument,
      );
      res.json(updateResult);
    });

    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollection.insertOne(newCompany);
      res.send(result);
    });

    app.get("/api/users", async (req, res) => {
      const cursor = usersCollection.find().skip(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/users/me", async (req, res) => {
      const query = {};
      if (req.query.email) {
        query.email = req.query.email;
      }
      const user = await userCollection.findOne(query);
      res.json(user || null);
    });

    app.get("/api/companies", async (req, res) => {
      const cursor = companyCollection.find().skip(4);
      const result = await cursor.toArray();
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

    // applicantUser
    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const newApplication = {
        ...application,
        createdAt: new Date(),
      };
      const result = await applicationsCollection.insertOne(newApplication);
      res.send(result);
    });

    app.get("/api/applications", async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = applicationsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get('/api/companies2', async (req, res) => {
            const pipeline = [
                {
                    $skip: 5
                },
                {
                    $limit: 2
                }
            ];

            const cursor = companyCollection.aggregate(pipeline);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/api/stats', async (req, res) => {
            const pipeline = [
                {
                    $group: {
                        _id: '$jobType',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $project: {
                        jobType: '$_id',
                        _id: 0,
                        count: 1
                    }
                },
                {
                    $sort: { count: 1 }
                }
            ]

            const cursor = jobCollection.aggregate(pipeline);
            const result = await cursor.toArray();
            res.send(result);
        })


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
