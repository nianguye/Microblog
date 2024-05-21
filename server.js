const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
require('dotenv').config();
const accessToken = process.env.EMOJI_API_KEY;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

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
                for (let like of curPost.likedBy) {
                    if (like == userId) {
    
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
app.get('/', (req, res) => {
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render('home', { posts, user, accessToken });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.get('/post/:id', (req, res) => {
    // TODO: Render post detail page

});
app.post('/posts', (req, res) => {
    // TODO: Add a new post and redirect to home
    addPost(req.body.title, req.body.content, findUserById(req.session.userId).username);
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
app.post('/register', (req, res) => {
    // TODO: Register a new user
    registerUser(req, res);

});
app.post('/login', (req, res) => {
    // TODO: Login a user
    loginUser(req, res);
});
app.get('/logout', (req, res) => {
    // TODO: Logout the user
    logoutUser(req, res)

});
app.post('/delete/:id', isAuthenticated, (req, res) => {
    // TODO: Delete a post if the current user is the owner
    const id = req.params.id;
    // get post
    let post = '';
    for (let curPost of posts) {
        if (curPost.id == id) {
            post = curPost;
            break;
        }
    }
    if (post != '') {
        posts = posts.filter(function(curPost) {
            return curPost != post;
        });
    }
    /* reset the id */
    for (let i = 0; i < posts.length; i++) {
        posts[i].id = i + 1;
    }
    res.redirect('/');
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
let posts = [
    { id: 1, title: 'Sample Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 1, likedBy: [2]},
    { id: 2, title: 'Another Post', content: 'This is another sample post.', username: 'AnotherUser', timestamp: '2024-01-02 12:00', likes: 0, likedBy: []},
];
let users = [
    { id: 1, username: 'SampleUser',
     avatar_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAD9UlEQVR4nO3bX2iVdRzH8fdp+Yfq5KAtN8Ioh4yMkFUzCyXoJtYfixYTGoFReLdoSgtSSAYyulAvMhBLLNZYuAK9UdSyGpI6JEhnZFmZGtbUEItYW3NdPByejbO2Z3Kenc/PPq+b8+w8vwPf8d72/DlnmeEOhjEZ1xV7ABvNQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAx1xd7gKvx8wV4aw/s64Wf+mBgCKpuhfqF8PKjUJaN1p39HeY0wXBHceedjOCCvL0PVn4At9wE6xrg8RrIzoTvfoWuw1DzOjz3EKx8DN79rNjTTl4mpH9p27ALVnVARSkcXAt3lOevOXcJnt4APT/Ez4X0GxLMMeT4WWjpjLbblo0dA6CyFPavhnkVUzdbIQUTZP0uGLoSbS+9d/y1N86ArSvSnykNwQT5pDfezmQmXr+kGu6Zk948aQkmSN/leHvP0WSvWbYonVnSFEyQ8my83dIZndJOpLYqvXnSEkyQxdXx9pmLsKQVjvw4/msW3J7uTGkIJkhzHZSMmPbUeVjcCmu64K+BsV8ze1ZYp7wQUJCFVdD67Ojn/h6EdTtg/quw40hx5iq0oC4MITr9fa0zPgUeqW4BbHweqiunfq5CCS4IwKGT8OIW+OaX/H3TSuCFh6PbKmXZ/P3qggwC0D8IG3dD2074oz9//+xZ8M5L8OQEF5Fqgg2Sc+4SrNkO73XDlTG+k+Y6WN+Y7GJSQfBBcr46Bc3t0P1t/r619fDGM1M+0lW5ZoLkbD8ETe+PvrKfVgJft8FdtxVvrqSCOe1NqmER9L4J98+Nnxscgs2fFm+myQgmSKYx2e0SgPKbYXdLdGDP2XssnbkKLZggEJ3uJlWWhdVPxV+fvlD4edIQVJADJya3ful98fbM6YWdJS1BBen8Egb+Sb6+YsSfrLsDOKBDYEH6LkP7geTrT/4WbzcE8t5IUEEAXmmP3l9PYsv+6LG6ElY8kt5MhRRckD/7o/dCPu4Zf13XYdi0Nzq471wF0wP5wFMwF4aZRti0HOpr4aOe6Lqi9IboJ792bvQplMEhOHoatn0B27qj5z9sgjv/4xMqioIKcn7z6Du4B7+HrZ9Hj2cuRveyKkrhwXnQ8AA8URPOPaycYIL8XwR3DLnWOYgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMf8CZljRrBGhTj8AAAAASUVORK5CYII=',
      memberSince: '2024-01-01 08:00'},
    { id: 2, username: 'AnotherUser', avatar_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAEAElEQVR4nO3bzUsqbxjG8evIKK2jF6MXqUVB217I/o6CkFoGBbZr3TLaZpAWRG2icO+qpb1DtGtpIRgZVLtkxuo+i3A4xs+OqTXX8zv3ByTDHG77+ozPBP0SEYGi4fN6AFVOg5DRIGQ0CBkNQkaDkNEgZDQIGQ1CRoOQ0SBkNAgZDUJGg5DRIGQ0CBkNQkaDkNEgZDQIGQ1CRoOQ0SBkNAgZDUJGg5DRIGQ0CBkNQkaDkNEgZDQImf9FkJmZGQwNDXk9RkP8Mv0/qO7v79HT0wPbtnF8fIxwOOz1SHUxfoWsr6/Dtm0AwNramsfT1M/oFVIsFtHb24tcLgcA8Pv9yGQy6Orq8niy2hm9QpLJJHK5HCzLAvAeaHNz0+Op6iQGGx0dFQCSSCQEgACQ1tZWKRQKXo9WM2ODnJycCAAZHx8XEZGxsTE3ys7OjsfT1c7YU1bpA3xhYaHsKwCsrq56MlNDeP2OqMXt7a0EAgHp6OgQ27ZFRMRxHOns7HRXyeHhocdT1sbIFZJIJOA4Dubn5xEIBAC877BmZ2fdnzF1C2zcttdxHIRCITw+PiKbzaK9vd197M+LRMuycH19bdwW2LgVsr+/j7u7O0xNTZXFAIC2tjZMTEwAAF5eXrCxseHFiPXx+pz5VSMjIwJAzs/P//Px09NTo7fARgU5OjoSABIOhz/9udL1CQDZ3t7+meEaxKhT1setbiXRaNS9H4vFvnWmhvP6HVGtXC4nfr+/bKtbiW3bEgwG3VWSTqd/aMr6GbNC4vE4isUi5ubm3K1uJYFAwNgtsBHbXtu2EQqFkM/na3q+ZVnIZDLo7u5u8GSNZ8QK2dvbQz6fx/T0NOR9I1LVLRKJAHjfAicSCY9fRZU8OVF+0fDwsACQs7OzLz2v9AdIANLS0iLPz8/fNGHj0AdJp9NVbXUrKV23AJCtra0GT9d49Kes0rb1b1vdSv7cAhvx4e71O+IzV1dX4vP5JBgMiuM4NR2jUChIc3Ozu0pSqVSDp2ws6hWyvLyMt7c3RCIR+P3+mo7R1NSEyclJ9/ulpSUI8caSNkgqlcLu7i4AoL+/v65jDQ4OuvcvLi6wsrJS1/G+lddL9KObmxuJxWJlp5m+vj5JJpOSzWbl9fW16mM9PDzIwcGBDAwMuMcCID6fT6LRqFxeXv71qv+n0QWxLKvsl/fxFo/HqzrO09PTp8cp3RYXF7/5FX2NEVfq/xLaz5B/lQYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HI/AbLZAYbyph6eQAAAABJRU5ErkJggg=='
    , memberSince: '2024-01-02 09:00'},
];

// Function to find a user by username
function findUserByUsername(username) {
    // TODO: Return user object if found, otherwise return undefined
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            return users[i];
        }
    }
    return undefined;
}

// Function to find a user by user ID
function findUserById(userId) {
    // TODO: Return user object if found, otherwise return undefined
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == userId) {
            return users[i];
        }
    }
    return undefined;
}

// Function to add a new user
function addUser(username) {
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


    let newID = {id: users.length + 1, username: username, avatar_url: 'data:image/png;base64,' + generateAvatar(username[0], 100, 100).toString('base64'), memberSince: `${year}-${month < 10 ? '0' + month : month}-${days} ${hours}:${minutes}`, posts: []}

    users.push(newID);
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
function registerUser(req, res) {
    // TODO: Register a new user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to register:", username);
    if (findUserByUsername(username)) {
        // User exist
        res.redirect('/register?error=Username+already+exists');
    }
    else {
        addUser(username);
        res.redirect('/login');
    }

}

// Function to login a user
function loginUser(req, res) {
    // TODO: Login a user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to login:", username);
    if (findUserByUsername(username)) {
        req.session.loggedIn = true;
        let user = (findUserByUsername(username));
        req.session.userId = user.id;
        res.redirect('/')
    }
    else {
        res.redirect('/login?error=Username+does+not+exists');   
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately
    /*
    req.session.loggedIn = false;
    req.session.userId = '';*/
    // Reference from the session and file slides
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.redirect('/error');
        } else {
            res.redirect('/');
        }
    });
    //res.redirect('/');
}

// Function to render the profile page
function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    let currentUser = {posts: []}
    for (let i = posts.length - 1; i >= 0; i--) {
        if (posts[i].username == findUserById(req.session.userId).username) {
            currentUser.posts.push(posts[i])
        } 
    }
    let user = getCurrentUser(req) || {}
    res.render('profile', { user, currentUser });
}

// Function to update post likes
function updatePostLikes(req, res) {
    // TODO: Increment post likes if conditions are met
    const id = req.params.id;
    let user = findUserByUsername(req.body.curUser)
    // get post
    let post = '';
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].id == id) {
            post = posts[i];
            break;
        }
    }
    if (post != '') {
        let alreadyLiked = false;
        for (let like of post.likedBy) {
            if (like == user.id) {
                alreadyLiked = true;
            }
        }
        if (alreadyLiked) {
            post.likes = post.likes - 1;
            post.likedBy = post.likedBy.filter(function(curId) {
                return curId != user.id;
            });
        }
        else {
            post.likes = post.likes + 1;
            post.likedBy.push(user.id);
        }
    }
    res.redirect('/');
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    // TODO: Generate and serve the user's avatar image
    const username = req.params.username;
    const userObject = findUserByUsername(username);
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
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
    // TODO: Create a new post object and add to posts array
    const now = new Date();

    // Get the current time components
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const days = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Adding 1 because months are zero-based (0 for January, 11 for December)

    let newID = {id: posts.length + 1, title: title, content: content, username: user, timestamp:`${year}-${month < 10 ? '0' + month : month}-${days} ${hours}:${minutes}`, likes: 0, likedBy: [] }
    posts.push(newID);
}

let randomColor = ["red","blue", "yellow", "pink", "purple", "orange", "brown", "grey"];
//(Math.floor(Math.random() * randomColor.length))]

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

