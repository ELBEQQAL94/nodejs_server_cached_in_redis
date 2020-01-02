const express = require('express');
const redis = require('redis');
const axios = require('axios');
const bodyParser = require('body-parser');


// SETUP PORT CONSTANTS
const redis_port = process.env.PORT || 6379;
const port = process.env.PORT || 3000;

// configure redis client on port 6379
const redis_client = redis.createClient(redis_port);

// INIT APP
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// middleware function to check cache
/* checkCache = (req, res, next) => {
    const {id} = req.params;

    // get data value from key=id
    redis_client.get(id, (err, data) => {
        if(err){
            console.log('Data Not Found!');
            res.status(500).json(err);
        }

        if(data != null){
            res.send(data);
        } else {
            next();
        }
    });
};
 */

// Endpoint:  GET /starships/:id
// @desc Return Starships data for particular starship id
/* app.get('/starships/:id', checkCache, async (req, res) => {
    try {
        const {id} = req.params;
        const starShipInfo = await axios.get(`https://jsonplaceholder.typicode.com/todos/${id}`);
        
        // get data from response
        const starShipData = starShipInfo.data;

        // add data to Redis
        redis_client.setex(id, 3600, JSON.stringify(starShipData));

        return res.json(starShipData);

    } catch(err) {
        console.log('Error: ', err);
        return res.status(401).json(err);
    }
}); */

// [ cache data type of array] cache posts in redis
cachePosts = (req, res, next) => {
 
    let posts = [];

    // get data value from key=id
    redis_client.lrange('posts',0 , -1, (err, data) => {

        if(err){
            console.log('Data Not Found!');
            res.status(500).json(err);
        }

        if(data != null){
            const parse_data = JSON.parse(data);
            parse_data.forEach(post => {
                posts.push(post);
            });
            res.status(200).json(posts);
            console.log('Data is chached!');
            
        } else {
            next();
        };
    });
};

// [cache object in redis] cache post request
cachePost = (req, res, next) => {

    const {id} = req.params;

    // get data value from key=id
    redis_client.get(id, (err, data) => {
        if(err){
            console.log('Data Not Found!');
            res.status(500).json(err);
        }

        if(data != null){
            res.send(data);
        } else {
            next();
        }
    });
};

// get posts data 
app.get('/', cachePosts, async (req, res) => {
    try {

       let posts = await axios.get('https://jsonplaceholder.typicode.com/posts');
         
       let data = posts.data;

       // cache posts in redis
        redis_client.lpush('posts', JSON.stringify(data));

       return res.json(data);

     } catch(error){
        console.log(error);
        res.status(500).json(error);
     }
});

// get single post
app.get('/post/:id', cachePost, async (req, res) => {

    let {id} = req.params;

    try {

        let post = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);

        let data = post.data;

        // cache post in redis
        redis_client.setex(id, 3600, JSON.stringify(data));

        return res.status(200).json(data);

    } catch(error){
        if(error) {
            res.status(500).json(error);
        };
    };
});

// listen on port 3000
app.listen(port, () => {
    console.log(`Server run on ${port}`);
});

