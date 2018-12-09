# eoe-arena

eoe-arena is a remake of the multiplayer mobile game Era of Eidolon which was shut down about 10 years ago

## Getting Started

Both the backend (NodeJS) and the frontend is written in vanilla JavaScript. Communication bridge in-between is done using sockets and ajax calls. Data for the application is stored in MongoDB database.

### Prerequisites

To run this project on a local machine you will need NodeJS and MongoDB.


Get NodeJS at [https://nodejs.org/](https://nodejs.org/)

Get MongoDB at [https://www.mongodb.com/download-center/community](https://www.mongodb.com/download-center/community)



You don't have to install MongoDB Compass for the project to run but it is handy to browse the database documents in a GUI environment. 

### Installing

Follow the steps to run the application locally

Run the following command in the root directory of the project to install the required npm modules

```
npm install
```

Start the NodeJS server

```
npm run start
```

The NodeJS server is running but the application also needs a database to store data

Run the MongoDB server with the following command
Windows: navigate to MongoDB bin directory in the install location to find the executable

```
./mongod.exe
```

The application should now fully work at [http://localhost:2000](http://localhost:2000) but there are no skills and items in the game.

To import the skill and item data, find the exported .json files in the ___MongoDB setup__ directory.

Windows: navigate to MongoDB bin directory in the install location to find the executable

```
mongoimport --db game --collection skills --file skills_exported.json
```
```
mongoimport --db game --collection items --file items_exported.json
```

That's it. The game should now have all the skills and items and you should be able to create new accounts and start battles at [http://localhost:2000](http://localhost:2000)

## Deployment

Deployment will be reviewed in the future if there is any interest in the development of this project.

## Contributing

Pull requests are welcome and encouraged. The project was written in a hurry and not much attention was given to structure, maintainability and readability so any contribution is welcome.

## Disclaimer

Most of the graphical assets in the project are from the defunct (for about 10 years) java mobile game Era of Eidolon, produced by watAgame [(http://watagame.com)](http://watagame.com). The assets are not owned by me or any other contributor to the eoe-arena project.
