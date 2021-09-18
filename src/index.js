const { request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

/* 
  id: uuid
  cpf: string
  name: string
  statement: [
    {
    amount: double,
    type: "credit" | "debit",
    description: string,
    createdAt: Date,
    }
  ]
*/

const costumers = [];

const app = express();

app.use(express.json());

function verifyIfAccountCPFExists(req, res, next) {
  const { cpf } = req.headers;

  const costumer = costumers.find((element) => element.cpf === cpf);

  if (!costumer) {
    return res.status(400).json({ error: "Costumer not found" });
  }

  req.costumer = costumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") return acc + operation.amount;
    else return acc - operation.amount;
  }, 0);
  return balance;
}

app.post("/account", function (req, res) {
  const { name, cpf } = req.body;

  const costumerAlreadyExists = costumers.some(
    (costumer) => costumer.cpf === cpf
  );

  if (costumerAlreadyExists) {
    return res.status(400).json({ error: "Costumer already exists" });
  }

  costumers.push({ id: uuidv4(), name, cpf, statement: [] });

  return res.status(201).send();
});

app.use(verifyIfAccountCPFExists);

app.get("/statement/", function (req, res) {
  const { costumer } = req;
  return res.json(costumer.statement);
});

app.get("/statement/date", function (req, res) {
  const { costumer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = costumer.statement.filter(
    (element) =>
      element.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.post("/deposit", function (req, res) {
  const { description, amount } = req.body;
  const { costumer } = req;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  costumer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", function (req, res) {
  const { description, amount } = req.body;
  const { costumer } = req;

  const accountBalance = getBalance(costumer.statement);

  if (accountBalance < amount) {
    return res.status(401).json({ error: "You don't have enough money" });
  }
  console.log("saldo antes da operação: ", accountBalance);

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "debit",
  };

  costumer.statement.push(statementOperation);

  console.log("saldo atual: ", getBalance(costumer.statement));

  return res.status(201).send();
});

app.put("/account", function (req, res) {
  const { costumer } = req;
  const { name } = req.body;

  costumer.name = name;

  return res.status(201).send();
});

app.get("/account", function (req, res) {
  const { costumer } = req;

  return res.json(costumer);
});

app.delete("/account", function (req, res) {
  const { costumer } = req;

  costumers.splice(costumers.indexOf(costumer), 1);

  return res.status(200).json(costumers);
});

app.get("/balance", function (req, res) {
  const { costumer } = req;

  const balance = getBalance(costumer.statement);

  return res.status(200).json(balance);
});

app.listen(3081);
