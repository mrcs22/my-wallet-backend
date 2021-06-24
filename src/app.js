import express from "express";
import cors from "cors";
import Joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import connection from "./database/database.js";

const app = express();
app.use(express.json());
app.use(cors());

//############## Sign Up ##################

app.post("/sign-up", async (req, res) => {
  try {
    const userSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
      password: Joi.string().required(),
    });

    const validationError = userSchema.validate(req.body).error;

    if (validationError) {
      const errorMessage = validationError.details[0].message;

      res.status(400);
      return res.send(errorMessage);
    }

    const { name, email, password } = req.body;
    const result = await connection.query(
      `SELECT * FROM users WHERE email ILIKE $1`,
      [email]
    );

    const hashedPassword = bcrypt.hashSync(password, 12);

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `
    INSERT INTO users
    (name,email,password)
    VALUES ($1,$2,$3) 
  `,
      [name, email, hashedPassword]
    );

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

//############## Sign In ##################

app.post("/sign-in", async (req, res) => {
  try {
    const userSchema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
      password: Joi.string().required(),
    });

    const validationError = userSchema.validate(req.body).error;

    if (validationError) {
      const errorMessage = validationError.details[0].message;

      res.status(400);
      return res.send(errorMessage);
    }

    const { email, password } = req.body;

    const result = await connection.query(
      `
    SELECT * FROM users
    WHERE email LIKE $1
    `,
      [email]
    );

    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.sendStatus(400);
    }

    const token = uuid();

    await connection.query(
      `
    INSERT INTO sessions
    (user_id, token)
    VALUES
    ($1,$2)
    `,
      [user.id, token]
    );

    delete user.password;
    user.token = token;

    res.send(user);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server is listening on port 4000.");
});
