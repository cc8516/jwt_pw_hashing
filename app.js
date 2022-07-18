const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");

const requireToken = async (req, res, next) => {
  try {
    req.user = await User.byToken(req.headers.authorization);
    next();
  } catch (error) {
    next(error);
  }
};

app.get("/home", requireToken, (req, res, next) => {
  res.send("Home page!");
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:userId/notes", requireToken, async (req, res, next) => {
  try {
    const user = req.user;
    // console.log("******", user.id);

    if (+user.id === +req.params.userId) {
      const notes = await Note.findAll({
        where: {
          userId: req.params.userId,
        },
      });

      res.send(notes);
    }
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
