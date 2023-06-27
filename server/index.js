const express = require("express"),
  app = express();
const cors = require("cors");
app.use(cors());

const io = require("socket.io")({
  cors: {
    origin: "http://localhost:3000",
  },
});
io.on("connection", (socket) => {});
io.listen(4000);

const API_URL =
  "https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator";

app.get("/", async function (req, res) {
  const groupSize = req.query.group_size;
  const requests = [];

  for (let i = groupSize; i <= groupSize + 2 && i <= 10; i++) {
    const reqBody = {
      query: {
        ...req.query,
        group_size: i,
      },
    };
    requests.push(
      fetch(API_URL, { body: JSON.stringify(reqBody), method: "POST" })
        .then((response) => response.json())
        .then((json) => {
          io.emit("data", json.body.accommodations);
        })
    );
  }

  res.setHeader("Content-Type", "text/html");

  Promise.allSettled(requests).then(() => {
    res.send();
  });
});

app.listen(5000, function () {
  console.log(
    "The web server is running. Please open http://localhost:5000/ in your browser."
  );
});
