# AERRDM
The title of the project: Automatic Emergency Rescue Resource Deployment in Metropolis. This project is for CSIT321. The project requires the development of  a mobile application and web application. The web application is used to simulate the emergency events and the mobile application is act as the resources. e.g. police car, ambulance. The potential users will be the emergency service departments, police force, fire station and hospital.

##Before run the application, install listing dependencies:

- angular-route#1.4.6
- angulajs-geocation#0.1.1
- bootstrap#3.3.5
- modernizr#3.0.0


##Folder structure
--app //Backend

----model.js

----routes.js

--public //front end

----index.html

----js

------app.js

------addCtrl.js

------gservice.js

----stule.css

--server.js	//Express server

--package.json

##To run the application:

- use mongod to start the mongoldb server
- type node server.js
- Go to localhost:3000
