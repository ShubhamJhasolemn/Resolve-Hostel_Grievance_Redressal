const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "This_is_my_db_password!",
  host: "localhost",
  port: 5432,
  database: "hostel"
});

pool.on("error", (error, client) => {
  console.log(error);
});

module.exports = {
  pool
};
