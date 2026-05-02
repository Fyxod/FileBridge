const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const connectDb = require("./config/db");
const { attachCurrentUser } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");
const groupRoutes = require("./routes/groups");
const userRoutes = require("./routes/users");

const app = express();

connectDb();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  }),
);

app.use(attachCurrentUser);

app.get("/", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/auth/login");
  }
  return res.redirect("/files");
});

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);
app.use("/groups", groupRoutes);
app.use("/users", userRoutes);

app.use((req, res) => {
  res.status(404).render("not-found", { title: "Not Found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).render("error", { title: "Error", error: err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`FileBridge listening on port ${port}`);
});
