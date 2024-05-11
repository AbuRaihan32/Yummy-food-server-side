const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fxbdhbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const foodCollection = client.db('foodDB').collection('food');
    
    
    
    // ! get all featured Foods
    app.get('/featuredFoods', async(req, res)=>{
      const email = req.query.email;
      const query = {donatorEmail: email}

      const result = await foodCollection.find(query).toArray();
      res.send(result)
    })
    

    // ! get single Foods
    app.get('/singleFood/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodCollection.findOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', async(req, res)=>{
    res.send('assignment server running')
})

app.listen(port, ()=>{
    console.log(`assignment server running in PORT : ${port}`)
})