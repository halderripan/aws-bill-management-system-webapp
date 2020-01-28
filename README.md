
#  webapp

  
This is a private repository for all the cloud assignments. We fork the repository to our personal accounts, create branches for assignments and then push the changes to the only branch (master) of the organization.

  

Organization link -> https://github.com/halderr-spring2020

Organization Repository Link -> https://github.com/halderr-spring2020/webapp

  

Personal School GitHub Account -> https://github.com/halderripan

Forked Repository on Personal School GitHub Account Link -> https://github.com/halderripan/webapp

---


##  Requirements

For development, you will only need **_Node.js and a node global package, postgres, sequelize-cli, mocha, postman, visual studio code & dbeaver_** installed in your environment.

##  Installations

###  1. Node & npm
---

- ####  Node installation on Mac

Just go on [official Node.js website](https://nodejs.org/) and download the installer for Mac.

Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- ####  Node installation on Ubuntu


You can install nodejs and npm easily with apt install, just run the following commands.

```bash
$ sudo apt install nodejs

$ sudo apt install npm
```

- ####  Other Operating Systems

You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command on a terminal.
```bash
$ node --version

v10.15.3

$ npm --version

6.4.1
```

If you need to update `npm`, you can make it using `npm`!

```bash
$ npm install npm -g
```


### 2. Cloning the repository
---
**2.1. Go to the [Organization Repository Link](https://github.com/halderr-spring2020/webapp)**

**2.2. Fork the repository to your personal GitHub**

**2.3. [Configure your system to connect to GitHub with SSH](https://help.github.com/en/articles/connecting-to-github-with-ssh)**

**2.4. Clone your forked repository using SSH**
```bash
$ git clone https://github.com/YOUR_USERNAME/PROJECT_TITLE

$ cd PROJECT_TITLE

$ npm install
```

###  3. Postgres
---

####  3.1. Postgres installation on Mac

Go to the [official website of postgres](https://www.postgresql.org/download/macosx/) and download the Interactive installer or Postgres.app

Once installed open a terminal and run the following steps

**3.1.1 Login through SuperUser**
```bash
$ psql -U postgres -h localhost
```
**3.1.2. Create a Database**
```sql
$ CREATE DATABASE cloudassignment;
```

**3.1.3. See all Databases**
```bash
$ \list
```

**3.1.4. Connect to our Database**
```bash
$ \c cloudassignment
```
---

#### 3.2. Postgres installation on Ubuntu
Go to the [official website of postgres](https://www.postgresql.org/download/linux/ubuntu/) and download the Interactive installer

Once installed open a terminal and run the following steps

**3.2.1. Login through SuperUser**
```bash
$ sudo -u postgres psql
```
**3.2.2. Create a Database**
```sql
$ CREATE DATABASE cloudassignment;
```

**3.2.3. See all Databases**
```bash
$ \list
```

**3.2.4. Connect to our Database**
```bash
$ \c cloudassignment
```
### 4. DBeaver
---

[DBeaver](https://dbeaver.io/) is a free multi-platform database tool for developers, database administrators, analysts and all people who need to work with databases. Supports all popular databases: MySQL, PostgreSQL, SQLite, Oracle, DB2, SQL Server, Sybase, MS Access, Teradata, Firebird, Apache Hive, Phoenix, Presto, etc.

Download DBeaver Community Edition from it's [official download page](https://dbeaver.io/download/).

Launch DBeaver. Connect to PostgresSQL Database. Provide the configs from the [config.json](https://github.com/halderr-spring2020/webapp/blob/master/server/config/config.json) file and connect.

### 5. Visual Studio Code
---

Install the latest visual studio code editor from the [official website](https://github.com/Microsoft/vscode).

### 6. Sequelize-cli
---

I'm using Sequelize, which is a database [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) that will interface with the Postgres database for us.

So for all the migrations of the code to the database like creating tables, we need to install a sequeilize cli.
```bash
$ npm install -g sequelize-cli
```
For migration:
```bash
$ sequelize db:migrate

== 01202020create-user: migrating =======
== 01202020create-user: migrated (0.027s)

== 01262020create-bill: migrating =======
== 01262020create-bill: migrated (0.018s)
```

### 7. Mocha
---

[Mocha](https://mochajs.org/) is a feature-rich JavaScript test framework running on Node.js and in the browser, making asynchronous testing _simple_ and _fun_. Mocha tests run serially, allowing for flexible and accurate reporting, while mapping uncaught exceptions to the correct test cases.

```bash
$ npm install -g mocha
```
The [package.json](https://github.com/halderr-spring2020/webapp/blob/master/package.json) file includes the following script for mocha to do `npm test` for unit and system integration testing.
```json
"test": "mocha 'test/*.js' --exit"
```
`--exit` means the mocha test server stops running after the testing ends.

### 8. Postman
---

[Postman](https://www.getpostman.com/) is a powerful tool for performing integration testing with your API. It allows for repeatable, reliable tests that can be automated and used in a variety of environments and includes useful tools for persisting data and simulating how a user might actually be interacting with the system.

Download Postman from it's [official website](https://www.getpostman.com/downloads/).

##  Running the project
```bash
$ npm start
```

##  Testing the project
```bash
$ npm test
```

##  Simple build for production

```bash
$ npm build
```
  

## Maintainers

Current maintainers:
* [Ripan Halder](https://github.com/halderripan)
