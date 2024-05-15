const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://yummy-food-f714c.web.app",
      "https://yummy-food-f714c.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ! custom middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fxbdhbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db("foodDB").collection("food");
    const teamCollection = client.db("foodDB").collection("team");

    // ! Token Related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ status: true });
    });

    // ! clear token when logged out
    app.post("/logout", async (req, res) => {
      console.log("hello");
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ status: true });
    });

    // !---------------------------------------------------------!\\

    // ! get all Foods by email
    app.get("/featuredFoods", verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden" });
      }
      let query = {};
      if (req.query?.email) {
        query = { donatorEmail: req.query.email };
      }

      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    // ! get single Foods
    app.get("/singleFood/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    // ! get All Available Foods
    app.get("/availableFoods", async (req, res) => {
      const foodStatus = req.query.foodStatus;
      const query = { foodStatus: foodStatus };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    // ! get All Requested Foods (private)
    app.get("/requestedFoods", verifyToken, async (req, res) => {
      if (req.user.email !== req.query.userEmail) {
        return res.status(403).send({ message: "forbidden" });
      }
      const foodStatus = req.query.foodStatus;
      const requesterEmail = req.query.userEmail;

      let query = {};
      if (req.query?.userEmail) {
        query = { foodStatus: foodStatus, requester: requesterEmail };
      }

      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    // ! post a food
    app.post("/addFood", verifyToken, async (req, res) => {
      const newFood = req.body;
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });

    // ! get team info
    app.get("/teams", async (req, res) => {
      console.log("hello");
      const result = await teamCollection.find().toArray();
      res.send(result);
    });

    // ! update food by user in manage my food pag
    app.put("/updateFood/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedFood = {
        $set: {
          foodName: food.foodName,
          foodImage: food.foodImage,
          quantityAvailable: food.quantityAvailable,
          pickupLocation: food.pickupLocation,
          expiryDateTime: food.expiryDateTime,
          additionalNotes: food.additionalNotes,
          foodStatus: food.foodStatus,
          donatorImage: food.donatorImage,
          donatorName: food.donatorName,
          donatorEmail: food.donatorEmail,
        },
      };
      const result = await foodCollection.updateOne(
        filter,
        updatedFood,
        options
      );
      res.send(result);
    });

    // ! update a food as Requested
    app.put("/requestFood/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedFood = {
        $set: {
          foodStatus: "Requested",
          foodId: id,
          requestDate: food.requestDate,
          requester: food.userEmail,
        },
      };

      const result = await foodCollection.updateOne(
        filter,
        updatedFood,
        options
      );
      res.send(result);
    });

    // ! delete food
    app.delete("/deleteFood/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("assignment server running");
});

app.listen(port, () => {
  console.log(`assignment server running in PORT : ${port}`);
});
