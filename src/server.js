import express from 'express';
import bodyParser from "body-parser";
import {MongoClient} from 'mongodb';
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
   try
   {
      const client = await MongoClient.connect("mongodb://localhost:27017");
      const db = client.db("my-blog");
      await operations(db);
      await client.close();
   }
   catch (error)
   {
      res.status(500).json({"message": "Error connecting to db", error});
   }
};

app.get('/api/articles', async (req, res) => {
   const articleName = req.params.name;
   const operations = async (db) => {
      const cursor = await db.collection("articles").find( {} );

      if ((await cursor.count()) === 0)
      {
         console.log("No documents found!");
      }

      const articles = await cursor.toArray();

      res.status(200).json(articles);
   };

   await withDB(operations, res);
});

app.get('/api/articles/:name', async (req, res) => {
   const articleName = req.params.name;
   const operations = async (db) => {
      const article = await db.collection("articles").findOne({"name": articleName});
      res.status(200).json(article);
   };

   await withDB(operations, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
   const articleName = req.params.name;
   const operations = async (db) => {
      const article = await db.collection("articles").findOne({"name": articleName});
      await db.collection("articles").updateOne({"name": articleName}, {
         '$set': {
            "upvotes": article.upvotes + 1
         }
      });
      const updatedArticle = await db.collection("articles").findOne({"name": articleName});

      res.status(200).json(updatedArticle);
   };

   await withDB(operations, res);
});

app.post('/api/articles/:name/comments/add', async (req, res) => {
   const articleName = req.params.name;
   const {username, text} = req.body;
   const operations = async (db) => {
      const article = await db.collection("articles").findOne({"name": articleName});
      await db.collection("articles").updateOne({"name": articleName}, {
         '$set': {
            "comments": article.comments.concat({username, text})
         }
      });
      const updatedArticle = await db.collection("articles").findOne({"name": articleName});

      res.status(200).json(updatedArticle);
   };

   await withDB(operations, res);
});

/*
app.get("/hello", (req, res) => {
   res.send("Hello!");
});

app.get("/hello/:name", (req, res) => {
   res.send("Hello " + req.params.name + "!");
});

app.post("/hello", (req, res) => {
   res.send("Hello " + req.body.name + " !");
});
*/

app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname + "/build/index.html"));
})

app.listen(8000, () => console.log("Listening on port 8000"));