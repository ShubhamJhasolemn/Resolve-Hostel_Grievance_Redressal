const express = require("express");
const cors = require("cors");
const app = express();
const db = require("../db");
const bcrypt = require("bcrypt");
const { jwtGenerator, jwtDecoder } = require("../utils/jwtToken");
app.use(cors());
app.use(express.json());

exports.userRegister = async (req, res) => {
  const { full_name, email, phone, password, type, block_id } = req.body;

  try {
    const user = await db.pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      return res.status(401).json("User already exist!");
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let newUser = await db.pool.query(
      "INSERT INTO users (full_name, email,  phone, password,  type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [full_name, email, phone, bcryptPassword, type]
    );

    await db.pool.query(
      "INSERT INTO block (block_name) VALUES ($1)", [block_id]
    );

    const jwtToken = jwtGenerator(
      newUser.rows[0].user_id,
      newUser.rows[0].type
    );

    if (type === "student") {
      const { block_id, usn, room } = req.body;
      console.log("This is new user "+newUser.rows);
      await db.pool.query(
        "INSERT INTO student (student_id, block_id, usn, room) VALUES ($1, $2, $3, $4)",
        [newUser.rows[0].user_id, block_id, usn, room]
      );
    } else if (type === "warden") {
      const { block_id } = req.body;
      console.log("This is new user "+newUser.rows);
      await db.pool.query(
        "INSERT INTO warden (warden_id,block_id) VALUES ($1, $2)",
        [newUser.rows[0].user_id, block_id]
      );
    }
    console.log(jwtDecoder(jwtToken));
    return res.json({ jwtToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Invalid Credential");
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json("Invalid Credential");
    }
    const jwtToken = jwtGenerator(user.rows[0].user_id, user.rows[0].type);
    console.log(jwtDecoder(jwtToken));
    return res.json({ jwtToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
