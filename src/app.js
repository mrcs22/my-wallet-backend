import express from "express";
import cors from "cors";
import Joi from "joi";
import bcrypt from "bcrypt";
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

app.listen(4000, () => {
  console.log("Server is listening on port 4000.");
});
