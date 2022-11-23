const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000")
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDBDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states", async (request, response) => {
  const getStatesArray = `
    SELECT * FROM state;
    `;
  const statesList = await db.all(getStatesArray);
  response.send(
    statesList.map((eachState) =>
      convertDBStateObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateArray = `
     SELECT * FROM state WHERE state_id = ${stateId};
    `;
  const getState = await db.get(getStateArray);
  response.send(convertDBStateObjectToResponseObject(getState));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrict = `
    INSERT INTO district 
    (district_name, state_id, cases, cured, active, deaths)
    VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `;
  const districtDetails = await db.run(createDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictArray = `
     SELECT * FROM district WHERE district_id = ${districtId};
    `;
  const getDistrict = await db.get(getDistrictArray);
  response.send(convertDBDistrictObjectToResponseObject(getDistrict));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = ` 
    DELETE FROM district WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
    UPDATE district SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured}, 
    active =${active},
    deaths =${deaths}

    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalList = `
    SELECT sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths 
    FROM district WHERE state_id = ${stateId};
    `;
  const totalList = await db.get(getTotalList);
  response.send(totalList);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT state_name FROM district 
    NATURAL JOIN state
    WHERE district_id = ${districtId};
    `;
  const getDistrict = await db.get(getDistrictDetails);
  response.send(convertDBStateObjectToResponseObject(getDistrict));
});

module.exports = app;
