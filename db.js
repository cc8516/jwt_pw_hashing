const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { TEXT } = require("sequelize");

const SALT_ROUND = 5;

const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

const Note = conn.define("note", {
  text: STRING,
});

User.hasMany(Note);
Note.belongsTo(User);

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, SALT_ROUND);
});

User.byToken = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT);

    const user = await User.findByPk(payload.token);

    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  //   if (user) {
  //     return user.id;
  //   }

  //   console.log("*****", password);
  //   console.log("*****", user.password);

  //   && (await bcrypt.compare(password, user.password))

  if (user && (await bcrypt.compare(password, user.password))) {
    return jwt.sign({ token: user.id }, process.env.JWT);
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];

  const notes = [
    { text: "hello", userId: 1 },
    { text: "hi", userId: 2 },
    { text: "gm", userId: 3 },
    { text: "good afternoon", userId: 1 },
  ];

  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3, note4] = await Promise.all(
    notes.map((note) => Note.create(note))
  );

  //   await lucy.setNote(note1);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
