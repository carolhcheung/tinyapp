const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

const getUserByEmail = (email) => {
  let result = null;
  for (let ids in userDatabase) {
    if (email === userDatabase[ids].email) {
      result = userDatabase[ids];
    }
  }
  return result;
};

//req.params.id = existing shortID
//req.body.longURL = new longURL from entry
//<%= id %> = shortID in ejs files

app.use(cookieParser());

//use EJS as templating engine
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
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

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies.user_id],
  };
  if (!req.cookies.user_id) {
    return res.redirect('login');
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console

  const shortId = generateRandomString();

  urlDatabase[shortId] = req.body.longURL;

  res.redirect(`/urls/${shortId}`);
});

// edit shortURL with new longURL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//post to delete urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//shows created/existing urls
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: userDatabase[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

//post to redirect to longURL after creating new shortID and longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//setup login route
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies.user_id],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email; 
  const password = req.body.password;
  
  let user = getUserByEmail(email)
  if (!user) {
    return res.status(403).send('Error: Email is incorrect, please try again!')
  }

  if (user.password !== password) {
    return res.status(403).send('Error: Password is incorrect, please try again!')
  }
  res.cookie('user_id', user.id)  
  res.redirect("/login");
});

//setup register route
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies.user_id],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const checkEmail = getUserByEmail(email);
  console.log(req.body); // Log the POST request body to the console

//check for empty email or password and check if user already exists
  if (!email || !password) {
    return res
      .status(400)
      .send("Error: Please enter email and password to register.");
  }
  if (checkEmail !== null) {
    return res.status(400).send("Error: Email already exists, please use a different email.");
  }
  userDatabase[userId] = { id: userId, email: email, password: password };

  res.cookie("user_id", userId);
  console.log(userDatabase);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.user_id);
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// //404 page: use this function for every request when there's no match found
//app.use((req, res) => {
//   res.status(404).render('404');
//});
