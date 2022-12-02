

//checks if email already exist in database if not will create new user in userDatabase as an object
const getUserByEmail = (email, database) => {
  let result = null;
  for (let ids in database) {
    if (email === database[ids].email) {
      result = database[ids];
    }
  }
  return result;
};

module.exports = getUserByEmail;