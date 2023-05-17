import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { rmSync } from "fs";

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("db connected!!"))
  .catch((e) => console.log(e));
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  pswd: String,
});

const User = mongoose.model("User", userSchema);

const app = express();
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// console.log(path.join(path.resolve(), "public"));
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "fsfkhfjkshkfkffjsjf");
    // console.log(decoded);
    req.user = await User.findById(decoded._id);
    next();
  } else {
    console.log("isAuthentication");
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  //   res.render("index.ejs", { name: "bharat", place: "delhi" });
  console.log(req.user);
  res.render("logout", { name: req.user.name });

  //   res.sendFile("index.html");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { email, pswd } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }
  const isMatch = pswd === user.pswd;
  if (!isMatch) {
    console.log(user);
    console.log(`${pswd}::${user.pswd}`);
    return res.render("login", { message: "plz enter the right password!!" });
  }
  const token = jwt.sign({ _id: user._id }, "fsfkhfjkshkfkffjsjf");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, pswd } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  user = await User.create({
    name,
    email,
    pswd,
  });

  const token = jwt.sign({ _id: user._id }, "fsfkhfjkshkfkffjsjf");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  //   console.log(token);
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5001, () => {
  console.log("express server started.");
});
