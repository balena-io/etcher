const fs = require("fs");
const path = require("path");

module.exports = JSON.parse(
  fs.readFileSync(path.join(__dirname, "node_modules", "@balena", "lint", "config", ".prettierrc"), "utf8"),
);
