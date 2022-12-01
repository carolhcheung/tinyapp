const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

//req.params.id = existing shortID
//req.body.longURL = new longURL from entry
//<%= id %> = shortID in ejs files
//req.cookies.user_id is the generated user id once they login successfully



//checks if email already exist in database if not will create new user in userDatabase hence an object
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
  let obj = {}
 
   for (let ids in urlDatabase){
 
     if (id === urlDatabase[ids].userID){
       obj[ids] = urlDatabase[ids]
     }
   } return obj;
 };

app.use(cookieParser());
app.use(morgan("dev"));

//use EJS as templating engine
app.set("view engine", "ejs");

// //existing urlDatabase
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };
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

//test users
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
  // const userURL = urlsForUser(req.cookies.user_id);

  const templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: userDatabase[req.cookies.user_id],
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
    user: userDatabase[req.cookies.user_id],
  };
  if (!req.cookies.user_id) {
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
    userID: req.cookies.user_id
  }
  if (!req.cookies.user_id) {
    return res.send('Please login to create shortURL.')
  }
  res.redirect(`/urls/${shortId}`);
});

// edit shortURL with new longURL
app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID you're trying to edit doesn't exist, please try again")
  }
  if (!req.cookies.user_id) {
    res.status(401).send("Please login to edit URL.")
  }
  if (userURL[req.params.id] === undefined) {
    res.status(401).send("You are not authorized to edit this URL.")
  }
  urlDatabase[req.params.id] = { 
    longURL: req.body.longURL, 
    userID: req.cookies.user_id };
    
  res.redirect("/urls");
});

//post to delete urls
app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID you're trying to delete doesn't exist, please try again")
  }
  if (!req.cookies.user_id) {
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
  if (!req.cookies.user_id) {
    res.status(401).send("Please login to use URL.")
  }
  const userURL = urlsForUser(req.cookies.user_id);
  
  if (userURL[req.params.id] === undefined) {
    res.status(401).send("You are not authorized to access this URL.")
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userDatabase[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

//post to redirect to longURL after creating new shortID and longURL
app.get("/u/:id", (req, res) => {

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short ID doesn't exist, please try again or create a new one")
  }
  const longURL = urlDatabase[req.params.id].longURL;
//if a short ID that doesn't exist is entered into browser
  res.redirect(longURL);
});

//setup login route
app.get("/login", (req, res) => { 
  const templateVars = {
    user: userDatabase[req.cookies.user_id],
  };
//if user logged in redirect to urls when trying to access /login
  if (req.cookies.user_id) {
  return res.redirect('urls');
  }  

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email; 
  const password = req.body.password;
//checks for email match
  let user = getUserByEmail(email)

  if (!user) {
    return res.status(401).send('Error: Email is incorrect, please try again!')
  }

//checks for password match
  if (user.password !== password) {
    return res.status(401).send('Error: Password is incorrect, please try again!')
  }
  res.cookie('user_id', user.id)  
  res.redirect("/login");
});

//setup register route
app.get("/register", (req, res) => {
   const templateVars = {
    user: userDatabase[req.cookies.user_id],
  };
//if user logged in redirect to urls when trying to access /register
  if (req.cookies.user_id) {
    return res.redirect('urls');
  }

  res.render("register", templateVars);
});

//register process
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
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
  userDatabase[userId] = { id: userId, email: email, password: password };
  //if not empty and email doesn't exist then create cookie for user 
  res.cookie("user_id", userId);
  console.log(userDatabase);

  res.redirect("/urls");
});
//clears the cookie for person who's logged
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// //404 page: use this function for every request when there's no match found
//app.use((req, res) => {
//   res.status(404).render('404');
//});
