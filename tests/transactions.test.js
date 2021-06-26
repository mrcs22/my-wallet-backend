import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database/database";

beforeAll(async () => {
  await connection.query(`
DELETE FROM sessions
`);
  await connection.query(`
DELETE FROM transactions
`);

  await connection.query(`
INSERT INTO sessions
(user_id, token)
VALUES
(1,'TokenSuperManeiro')
`);

  await connection.query(`
INSERT INTO transactions
(user_id, description, date, value, type)
VALUES
(1,'mesa bonita', '2020-02-15',300000,'out'),
(1,'notebook bacana', '2020-06-21',600000,'out'),
(1,'cadeira top', '2020-08-26',200000,'out')
`);
});

describe("GET /transactions", () => {
  it("returns status 400 for no token", async () => {
    const result = await supertest(app).get("/transactions");
    expect(result.status).toEqual(400);
  });

  it("returns status 401 for invalid token", async () => {
    const result = await supertest(app)
      .get("/transactions")
      .set("Authorization", "TokenNadaLegal");
    expect(result.status).toEqual(401);
  });

  it("returns status 200 for valid token", async () => {
    const result = await supertest(app)
      .get("/transactions")
      .set("Authorization", "TokenSuperManeiro");
    expect(result.status).toEqual(200);
  });

  it("returns correct data for valid token", async () => {
    const result = await supertest(app)
      .get("/transactions")
      .set("Authorization", "TokenSuperManeiro");

    const resultData = JSON.parse(result.text);
    resultData.transactions.forEach((t) => delete t.id);

    const expectedResponse = {
      total: -1100000,
      transactions: [
        {
          user_id: 1,
          description: "cadeira top",
          value: 200000,
          date: "2020-08-26",
          type: "out",
        },
        {
          user_id: 1,
          description: "notebook bacana",
          value: 600000,
          date: "2020-06-21",
          type: "out",
        },

        {
          user_id: 1,
          description: "mesa bonita",
          value: 300000,
          date: "2020-02-15",
          type: "out",
        },
      ],
    };

    expect(resultData).toEqual(expectedResponse);
  });
});

describe("POST /transactions", () => {
  it("returns status 400 for no token", async () => {
    const result = await supertest(app).post("/transactions");
    expect(result.status).toEqual(400);
  });

  it("returns status 401 for valid body but invalid token", async () => {
    const validBody = {
      description: "Sorvete",
      value: 500,
      type: "in",
    };

    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenNadaLegal")
      .send(validBody);
    expect(result.status).toEqual(401);
  });

  it("returns status 400 valid token but invalid description", async () => {
    const inValidBody = {
      description: 456,
      value: 500,
      type: "in",
    };

    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenNadaLegal")
      .send(inValidBody);
    expect(result.status).toEqual(400);
  });

  it("returns status 400 valid token but invalid value", async () => {
    const inValidBody = {
      description: "Outro sorvete",
      value: "...",
      type: "in",
    };

    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenNadaLegal")
      .send(inValidBody);
    expect(result.status).toEqual(400);
  });

  it("returns status 400 valid token but invalid type", async () => {
    const inValidBody = {
      description: "Mais um sorvete",
      value: 500,
      type: "debt",
    };

    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenNadaLegal")
      .send(inValidBody);
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for valid token but empty body", async () => {
    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenSuperManeiro");

    expect(result.status).toEqual(400);
  });

  it("returns status 201 for valid token and valid params", async () => {
    const validBody = {
      description: "Sorvete",
      value: 500,
      type: "in",
    };

    const result = await supertest(app)
      .post("/transactions")
      .set("Authorization", "TokenSuperManeiro")
      .send(validBody);
    expect(result.status).toEqual(201);
  });
});

afterAll(async () => {
  await connection.query(`
  DELETE FROM sessions
  `);
  await connection.query(`
  DELETE FROM transactions
  `);

  connection.end();
});
