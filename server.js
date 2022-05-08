//Import libraries
const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Connect MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tndro.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const run = async () => {
    try {
        await client.connect();
        const groceryCollection = client.db("warehouse").collection("groceryItems");
        const reviewsCollection = client.db("warehouse").collection("reviews");
        app.get('/items', async (req, res) => {
            const query = {};
            const cursor = groceryCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/myitems', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const cursor = groceryCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

        app.post('/items', async (req, res) => {
            const newItem = req.body;
            const result = await groceryCollection.insertOne(newItem);
            res.send(result);
        })

        app.get('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await groceryCollection.findOne(query);
            res.send(item);
        })
        app.put('/items/:id', async (req, res) => {
            const id = req.params.id;
            const options = { upsert: true };
            const updateQuantity = req.body;
            const updateDoc = {
                $set: {
                    quantity: updateQuantity.quantity
                },
            };
            const filter = { _id: ObjectId(id) };
            const item = await groceryCollection.updateOne(filter, updateDoc, options);
            res.send(item);
        })

        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await groceryCollection.deleteOne(query);
            res.send(result);
        })



    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hi!')
})


app.listen(port);
