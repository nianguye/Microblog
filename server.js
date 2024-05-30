const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const populateDB = require('./populatedb.js');
const passport = require('passport');
const dbFileName = 'microblog.db';
const showDB = require('./showdb.js');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');

require('dotenv').config();


const accessToken = process.env.EMOJI_API_KEY;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

// Load environment variables from .env file
dotenv.config();


// Use environment variables for client ID and secret
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Configure passport
passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`,
    userProfileURL:'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile']
}, (token, tokenSecret, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
            likeCond: function (curPost, userId, options ) {
                let curArray = curPost.likedby.split(",");
                for (let like of curArray) {
                    if (parseInt(like) == userId) {
    
                        return options.fn(this);
                    }
                }
                return options.inverse(this);
            }
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    res.locals.appName = 'MicroBlog';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false
    res.locals.userId = req.session.userId || '';
    res.locals.hashedGoogleId = req.session.hashedGoogleId || '';
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
// Given by CourseAI
function hash(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/googleLogout', (req,res) => {
    res.render('googleLogout');
}
);

app.get('/logoutCallback',(req,res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            // Redirect to a different page after logout
            res.redirect('/');
        }
    });
}
);

app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/' }),
        async (req, res) => {
        const googleId = req.user.id;
        console.log(googleId);
        const hashedGoogleId = hash(googleId);
        req.session.hashedGoogleId = hashedGoogleId;
    // Check if user already exists
        try {
            let localUser = await findUserByHashedGoogleId(hashedGoogleId);
            console.log(localUser)
            if (localUser) {
                req.session.userId = localUser.id;
                req.session.loggedIn = true;
                res.redirect('/');
            } else {
                res.redirect('/registerUsername');
            }
        }
        catch(err){
            console.error('Error finding user:', err);
            res.redirect('/error');
        }
    }
);

app.get('/registerUsername', (req, res) => {
    res.render('registerUsername', { regError: req.query.error });
});

app.post('/registerUsername', (req, res) => {
    // TODO: Register a new user
    registerUser(req, res);

});
let postType = '';


app.post('/postChange',(req, res) => {
    // TODO: Update post likes
    // id: postId

    postType = req.body.curType;
    console.log(postType);
    res.status(200).send({ message: 'Likes updated sucessfully' });
});

app.get('/', async (req, res) => {
    const posts = await getPosts(postType);
    const user = await getCurrentUser(req) || {};
    res.render('home', { posts, user, accessToken });
});

// Register GET route is used for error response from registration
//

app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.get('/post/:id', (req, res) => {
    // TODO: Render post detail page

});
app.post('/posts', async (req, res) => {
    // TODO: Add a new post and redirect to home
    const userId = await findUserById(req.session.userId);
    addPost(req.body.title, req.body.content, userId.username);
    res.redirect('/');
    //const posts = getPosts();
    //const user = getCurrentUser(req) || {};
    //res.render('home', { posts, user });
});
app.post('/like/:id', isAuthenticated,(req, res) => {
    // TODO: Update post likes
    // id: postId

    updatePostLikes(req, res);

});



app.get('/profile', isAuthenticated, (req, res) => {
    // TODO: Render profile page
    renderProfile(req,res);
});
app.get('/avatar/:username', (req, res) => {
    // TODO: Serve the avatar image for the user
    handleAvatar(req, res);
});
/*
app.post('/register', (req, res) => {
    // TODO: Register a new user
    registerUser(req, res);

});
app.post('/login', (req, res) => {
    // TODO: Login a user
    loginUser(req, res);
});*/
app.get('/logout', (req, res) => {
    // TODO: Logout the user
    logoutUser(req, res)

});
app.post('/delete/:id', isAuthenticated, async (req, res) => {

    const id = req.params.id;
    let db = await getDBConnection();
    await db.run('DELETE from posts WHERE id=?', [id]);
    await db.close();
    res.status(200).send({ message: 'Post deleted successfully' });

});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users


// Make sure to wait for the function

async function getDBConnection() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    return db;
}

getDBConnection();
// Function to find a user by username
async function findUserByUsername(username) {
    // TODO: Return user object if found, otherwise return undefined
    let db = await getDBConnection();
    let qry = `SELECT * FROM users WHERE username=?`
    let result = await db.get(qry,[username]);
    await db.close();
    return result;
}

async function findUserByHashedGoogleId(googleId) { 
    let db = await getDBConnection();
    console.log(googleId)
    let qry = `SELECT * FROM users WHERE hashedGoogleId=?`
    let result = await db.get(qry,[googleId]);
    await db.close();
    return result;
}

// Function to find a user by user ID
async function findUserById(userId) {
    // TODO: Return user object if found, otherwise return undefined    
    let db = await getDBConnection();
    let qry = `SELECT * FROM users WHERE id=?`
    let result = await db.get(qry, [userId]);
    await db.close();
    return result;
}

// Function to add a new user
async function addUser(username, req) {
    // TODO: Create a new user object and add to users array
    /* Given from the courseAI */
    // Create a new Date object
    const now = new Date();

    // Get the current time components
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const days = now.getDate();

    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Adding 1 because months are zero-based (0 for January, 11 for December)
    let hashId = req.session.hashedGoogleId;
    let db = await getDBConnection();
    db.run(
        'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
        [username, hashId, 'data:image/png;base64,' + generateAvatar(username[0], 100, 100).toString('base64'), `${year}-${month < 10 ? '0' + month : month}-${days} ${hours}:${minutes}`]
    );
    await db.close();
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
/* Reference from Wednesday lecture 5/15/24 */
async function registerUser(req, res) {
    // TODO: Register a new user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to register:", username);
    let result = await findUserByUsername(username);
    if (result) {
        // User exist
        res.redirect('/registerUsername?error=Username+already+exists');
    }
    else {
        await addUser(username, req);
        await loginUser(req, res);

    }

}

// Function to login a user
async function loginUser(req, res) {
    // TODO: Login a user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to login:", username);
    user = await findUserByUsername(username)
    if (user) {
        req.session.loggedIn = true;
        req.session.userId = user.id;
        req.session.hashedGoogleId = user.hashedGoogleId
        res.redirect('/')
    }
    else {
        res.redirect('/login?error=Username+does+not+exists');   
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately

    // Reference from the session and file slides
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.redirect('/error');
        } else {
            res.redirect('/googleLogout');
        }
    });
}

// Function to render the profile page
async function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    let currentUser = {posts: []}
    let db = await getDBConnection();
    let user = await getCurrentUser(req) || {}

    if (postType == '' || postType == "Recent") {
        currentUser.posts = await db.all(`SELECT * FROM posts WHERE username=?`,[user.username]);
        currentUser.posts = currentUser.posts.reverse();
    }
    else {
        currentUser.posts = await db.all(`SELECT * FROM posts WHERE username=? ORDER BY likes DESC`, [user.username]);
    }
    await db.close();
    res.render('profile', { user, currentUser });
}

// Function to update post likes
async function updatePostLikes(req, res) {
    // TODO: Increment post likes if conditions are met
    let db = await getDBConnection();
    const id = req.params.id;
    let user = await findUserByUsername(req.body.curUser)
    let curPost =  await db.get(`SELECT * FROM posts WHERE id=?`,[id]);

    let curArray = curPost.likedby.split(",");

    let alreadyLiked = false;
    for (let like of curArray) {

        if (parseInt(like) == user.id) {
            alreadyLiked = true;
        }
    }
    // if liked already, remove the like
    if (alreadyLiked) {
        await db.run(
            `UPDATE posts SET likes = ? WHERE id = ?`,[curPost.likes - 1,id]
        );

        curArray = await curArray.filter(function(curId){
            return parseInt(curId) != user.id;
        });

        await db.run(
            `UPDATE posts SET likedby = ? WHERE id = ?`,[curArray.join(","),id]
        );

    }
    else {
        await db.run(
            `UPDATE posts SET likes = ? WHERE id = ?`,[curPost.likes + 1,id]
        );

        await curArray.push(user.id.toString());

        await db.run(
            `UPDATE posts SET likedby = ? WHERE id = ?`,[curArray.join(","),id]
        );  
    }
    await db.close()
    res.status(200).send({ message: 'Post added successfully' });
}

// Function to handle avatar generation and serving
async function handleAvatar(req, res) {
    // TODO: Generate and serve the user's avatar image
    const username = req.params.username;
    const userObject = await findUserByUsername(username);
    if (userObject.avatar_url == undefined) {
        let avatarGenerate = generateAvatar(username[0], 100, 100)
        userObject.avatar_url = 'data:image/png;base64,' + avatarGenerate.toString('base64');
    }
    res.send(userObject.avatar_url);
    
}

// Function to get the current user from session
function getCurrentUser(req) {
    // TODO: Return the user object if the session user ID matches
    return findUserById(req.session.userId);
}

// Function to get all posts, sorted by latest first
async function getPosts(postType) {

    let db = await getDBConnection();
    if (postType == "Recent" || postType == '') {
        let posts = await db.all(`SELECT * FROM posts`);
        await db.close();
        return posts.slice().reverse();
    }
    else {
   
        let posts = await db.all(`SELECT * FROM posts ORDER BY likes DESC`);
        await db.close();
        return posts.slice()
    }
}

// Function to add a new post
async function addPost(title, content, user) {
    // TODO: Create a new post object and add to posts array
    const now = new Date();
    // Get the current time components
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const days = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Adding 1 because months are zero-based (0 for January, 11 for December)

    let db = await getDBConnection();
    db.run(
        'INSERT INTO posts (title, content, username, timestamp, likes, likedby) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, user, `${year}-${month < 10 ? '0' + month : month}-${days} ${hours}:${minutes}`, 0, '']
    );
    await db.close();
}

let randomColor = ["red","blue", "yellow", "pink", "purple", "orange", "brown", "grey"];

function generateAvatar(letter, width = 100, height = 100)  {
    const canva = canvas.createCanvas(width,height);
    const context = canva.getContext("2d");
    context.fillStyle = randomColor[(Math.floor(Math.random() * randomColor.length))];
    context.fillRect(0,0,canva.width,canva.height)
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.font = '40px Times New Roman';
    context.fillText(letter, 50,60);
    return canva.toBuffer()
}

