const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: "apple",
  keys: ["banana", "orange"], 
  maxAge: 24 * 60 * 60 * 1000 
}))

//checks if email already exist in database if not will create new user in userDatabase as an object
const getUserByEmail = (email) => {
  let result = null;
  for (let ids in userDatabase) {
    if (email === userDatabase[ids].email) {
      result = userDatabase[ids];
    }
  }
  return result;
};
//filters urls for specific userid
const urlsForUser = (id) => {
  let urlObj = {}
 
   for (let ids in urlDatabase){
 
     if (id === urlDatabase[ids].userID){
       urlObj[ids] = urlDatabase[ids]
     }
   } return urlObj;
 };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  i3BoG1: {
    longURL: "https://www.telus.com",
    userID: "abc",
  },
  i3BoG2: {
    longURL: "https://www.amazon.jp",
    userID: "abc",
  },
};


const userDatabase = {
  abc: {
    id: 'abc',
    email: 'a@a.com',
    password: '1234'
  }
};

//before routes, convert request body from Buffer into readable string
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//set route for urls, user can only access own urls
app.get("/urls", (req, res) => {

  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: userDatabase[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

//Generates random id for shortURL
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateRandomString() {
  let result = "";
  const length = 6;
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

//restrict access to newURL if not logged in and redirect to login page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.user_id],
  };
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

//generate short ID for longURL
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console

  const shortId = generateRandomString();

  urlDatabase[shortId] = { 
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  if (!req.session.user_id) {
    return res.send('Please login to create shortURL.')
  }
  res.redirect(`/urls/${shortId}`);
});

// edit shortURL with new longURL
app.post("/urls/:id", (req, res) => {
  const userURL = urlsForUser(req.session.user_id);
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID you're trying to edit doesn't exist, please try again")
  }
  if (!req.session.user_id) {
    res.status(401).send("Please login to edit URL.")
  }
  if (userURL[req.params.id] === undefined) {
    res.status(401).send("You are not authorized to edit this URL.")
  }
  urlDatabase[req.params.id] = { 
    longURL: req.body.longURL, 
    userID: req.session.user_id };
    
  res.redirect("/urls");
});

//post to delete urls
app.post("/urls/:id/delete", (req, res) => {
  const userURL = urlsForUser(req.session.user_id);
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID you're trying to delete doesn't exist, please try again")
  }
  if (!req.session.user_id) {
    res.status(401).send("Please login to delete URL.")
  }
  if (userURL[req.params.id] === undefined) {
    res.status(401).send("You are not authorized to delete this URL.")
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//shows shortIDs created/existing
app.get("/urls/:id", (req, res) => {
  
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID doesn't exist, please try again or create a new one")
  }
  if (!req.session.user_id) {
    res.status(401).send("Please login to use URL.")
  }
  const userURL = urlsForUser(req.session.user_id);
  
  if (userURL[req.params.id] === undefined) {
    res.status(401).send("You are not authorized to access this URL.")
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userDatabase[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});

//redirect to longURL after creating new shortID and longURL
app.get("/u/:id", (req, res) => {
//if a short ID that doesn't exist is entered into browser
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID doesn't exist, please try again or create a new one")
  }
  const longURL = urlDatabase[req.params.id].longURL;

  res.redirect(longURL);
});

app.get("/login", (req, res) => { 
  const templateVars = {
    user: userDatabase[req.session.user_id],
  };

//if user logged in redirect to urls when trying to access /login
  if (req.session.user_id) {
  return res.redirect('urls');
  }  

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email; 
  const password = req.body.password;

  let user = getUserByEmail(email)
  //checks for password match
  if ( !user|| !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Error: Invalid email or password, sorry please try again!')
  }

  req.session.user_id = userId
  res.redirect("/urls");
});


app.get("/register", (req, res) => {
   const templateVars = {
    user: userDatabase[req.session.user_id],
  };
//if user logged in redirect to urls when trying to access /register
  if (req.session.user_id) {
    return res.redirect('urls');
  }

  res.render("register", templateVars);
});


app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const checkEmail = getUserByEmail(email);
  console.log(req.body); // Log the POST request body to the console

//check for empty email or password for registration
  if (!email || !password) {
    return res
      .status(401)
      .send("Error: Please enter email and password to register.");
  }
 //check if email exists already for registration 
  if (checkEmail !== null) {
    return res.status(401).send("Error: Email already exists, please use a different email.");
  }
  userDatabase[userId] = { id: userId, email: email, password: hashedPassword };

  req.session.user_id = userId;
  console.log(userDatabase);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
