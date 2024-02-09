const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fikwith.mongodb.net/?retryWrites=true&w=majority`;

// middleware
app.use(cors());
app.use(express.json());


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT =(req, res, next) =>{
  const authHeader =req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'unauthorize access'})
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
     return  res.status(403).send({message: 'Forbidden  access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db('GeniusCarDB').collection('services');
    const productCollection = client.db('GeniusCarDB').collection('products');
    const orderCollection = client.db('GeniusCarDB').collection('orders');
    const teamCollection = client.db('GeniusCarDB').collection('team');
    const featureCollection = client.db('GeniusCarDB').collection('features');
    const testCollection = client.db('GeniusCarDB').collection('testimonial');

    // json Api
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'} )
      res.send({token})
    })



    app.get('/test', async(req, res)=>{
        const cursor = testCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });
    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    app.get('/team', async(req, res)=>{
      const cursor = teamCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/feature', async(req, res)=>{
      const cursor = featureCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const query ={_id : new ObjectId(id)};
      const result = await serviceCollection.findOne(query);
      res.send(result)
    })

    app.get('/products', async(req, res)=>{
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    });

    // Orders Api
    app.get('/orders', verifyJWT, async(req, res)=>{

      const decoded = req.decoded;

      if(decoded.email !== req.query.email){
        res.status('403').send({message: 'unauthorized access'})
      }

      let query ={};

      if(req.query.email){
        query ={
          email: req.query.email
        }
      }
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/orders', async(req, res)=>{
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result)
    })

    app.patch('/orders/:id', async(req, res)=>{
      const id = req.params.id;
      const status = req.body.status;
      const query ={_id : new ObjectId(id)}
      const updateDoc ={
        $set:{
          status: status
        }
      };
      const result = await orderCollection.updateOne(query, updateDoc);
      res.send(result)
    })

    app.delete('/orders/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })
   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Genius car server is Running')
});

app.listen(port, ()=>{
    console.log(` Genius car server is Running on port ${port}`)
})