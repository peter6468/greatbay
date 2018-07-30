var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database: is a a script
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 8889,

    // Your username
    user: "root",

    // Your password
    password: "root",
    database: "greatBay_DB"
});

// connect to the mysql server and sql database; callback connection
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected as id: " + connection.threadId);
    // run the start function after the connection is made to prompt the user
    start();
});

//function wh/prompts user for the action they should take
var start = function () {
    inquirer.
        prompt(
        {
            name: "postOrBid",
            type: "rawlist",
            message: "Would you like to [POST] and auction or [BID]",
            choices: ["POST", "BID"]
        })
        //.then is asynchronous, a promise
        .then(function (answer) {
            //based on their answer, either call the bid or the post function
            if (answer.postOrBid.toUpperCase() === "POST") {
                postAuction()

            } else {

                bidAuction();
            }
        });
}

//function to handle posting new items up for auction
var postAuction = function () {
    //prompt for info about the item being put up for auction
    inquirer
        .prompt([
        {
            name: "item",
            type: "input",
            message: "What is the item you would like to submet?"
        },
        {
            name: "category",
            type: "input",
            message: "What category would you like to place your auction in?"
        },
        {
            name: "startingBid",
            type: "input",
            message: "What would you like your starting bid to be?",
            vaidate: function (value) {
                if (isNaN(value) === false) {
                    return true;
                }
                    return false;
            }
        }
        ])
        .then(function(answer) {
        //when finished prompting, insert a new item into the db w/that info
        connection.query(
            "INSERT INTO auctions SET ?",
            {
                item_name: answer.item,
                category: answer.category,
                starting_bid: answer.startingBid,
                highest_bid: answer.startingBid
            },
            function(err) {
                if (err) throw err;
                console.log("Your action was created succesfully");
                // re prompt the user if they want to bid or post
                start();
            }
        );
    });
}

var bidAuction = function() {
    //query the db for all items being auctioned
    connection.query("SELECT * FROM auctions", function(err, results) {
        if (err) throw err;
        //once you have the items, prompt the user for wh/ they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function() {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].item_name);
                        }
                        return choiceArray;
                    },
                    message: "What auction would you like to place a bid in?"
                },
                {
                    name: "bid",
                    type: "input",
                    message: "How much would you like to bid?"
                }
            ])
            .then(function(answer) {
                //get the info of the chosen item
                var chosenItem;
                for (var i = 0; i < results.legth; i++) {
                    if (results[i].item_name === answer.choice) {
                        chosenItem = result[i];
                    }
                }

                //deter if bid was high enough
                if (chosenItem.highest_bid < parseInt(answer.bid)) {
                    //bid was hi enough, so update db, let the user know + start over
                    connection.query(
                        "UPDATE auctions SET ? WHERE ?",
                        [
                            {
                                highest_bid: answer.bid
                            },
                            {
                                id: chosenItem.id
                            }
                        ],
                        function(error) {
                            if (error) throw err;
                            console.log("Bid placed successfully!");
                            start();
                        }
                    );
                } else {
                    //bid wasnt hi enough, so apologize and start over
                    console.log("Your bid was too low.  Try again...");
                    start();
                }
            });
    });
}
