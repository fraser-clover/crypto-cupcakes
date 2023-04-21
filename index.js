require("dotenv").config(".env");
const cors = require("cors");
const express = require("express");
const app = express();
const morgan = require("morgan");
const { PORT = 3000 } = process.env;
const jwt = require("jsonwebtoken");
// TODO - require express-openid-connect and destructure auth from it
const { auth } = require("express-openid-connect");

const {
  AUTH0_SECRET, // generate one by using: `openssl rand -base64 32`
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_BASE_URL,
  JWT_SECRET,
} = process.env;

const config = {
  authRequired: false, // this is different from the documentation
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: AUTH0_AUDIENCE,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_BASE_URL,
};

const { User, Cupcake } = require("./db");

// middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:
// define the config object
// attach Auth0 OIDC auth router
// create a GET / route handler that sends back Logged in or Logged out

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use(async (req, res, next) => {
  // stuff for bonus
  // first, change authrequired in config to false
  const auth = req.headers["authorization"];

  if (auth) {
    const token = auth.split(" ")[1];
    const isValid = jwt.verify(token, JWT_SECRET, function (err){
      res.status(401).send(err.message)
    });

    if (isValid) {
      const data = req.oidc.user;
      res.send(data);
      next();
    }
  } else {
    //console.log(req.headers);
    res.redirect("/login")
  }
  

  // original work below
  // first, change authrequired in config to true

  // const [user] = await User.findOrCreate({
  // where: {
  //    username: req.oidc.user.nickname,
  //    name: req.oidc.user.name,
  //    email: req.oidc.user.email
  // }
  // });

  // console.log(req);
  // console.log(user);
  // next();
});


// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  console.log(req.oidc.user);
  res.send(
    req.oidc.isAuthenticated()
      ? `Logged in 
  <h1 style="color:#008900; text-align:center">My Web App, Inc.</h1>
  <h1>Welcome, ${req.oidc.user.given_name} ${req.oidc.user.family_name} </h1>
  <p><strong>Username: ${req.oidc.user.nickname}</strong></p>
  <p>${req.oidc.user.email}</p>
  <img src="${req.oidc.user.picture}" />`
      : "Logged out"
  );
});

app.get("/cupcakes", async (req, res, next) => {
  try {
    if (!req.oidc.user) {
      console.error("no user");
      res.status(401);
    }
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.post("/cupcakes", async (req, res, next) => {
  try {
    if (!req.oidc.user) {
      console.error("no user");
      res.status(401);
    }
    const { userId } = req.user.id;
    const { title, flavor, stars} = req.body;
    
    const cupcakes = await Cupcake.create(userId, title, flavor, stars);
    res.status(201).send(cupcakes);

  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get("/me", async (req, res, next) => {
  const user = await User.findOne({
    where: {
      username: req.oidc.user.nickname,
    },
    raw: true,
  });

  if (user) {
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1w" });
    res.send({ user, token });
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  if (res.statusCode < 400) res.status(500);
  res.send({ error: error.message, name: error.name, message: error.message });
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});
