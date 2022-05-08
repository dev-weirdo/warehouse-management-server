//Import libraries
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden' });
        }
        req.decoded = decoded;
    })
    next();
}

//Connect MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tndro.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const run = async () => {
    try {
        await client.connect();
        const groceryCollection = client.db("warehouse").collection("groceryItems");
        const reviewsCollection = client.db("warehouse").collection("reviews");

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '7d'
            })
            res.send({ accessToken });
        })

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

        app.get('/myitems', verifyJWT, async (req, res) => {
            const dEmail = req?.decoded.email;
            const email = req?.query.email;
            if (email === dEmail) {
                const query = { email };
                const cursor = groceryCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
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
