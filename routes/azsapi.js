// Exports
/* ------------------------------------------------------------------------------------- */
module.exports = function (app) {

    // Creating coupon manager and connection to MongoLab
    var base = "/azs/1.0/";

    // ----------------------------------------------------------------------------------------
    // Connect
    // ----------------------------------------------------------------------------------------
    var mongo_user = process.env.mongoUser;
    var mongo_password = process.env.mongoPassword;

    if (mongo_user == "" || mongo_password == "") {
        console.log("Mongo authentication not present, trying to get from environment!");
        mongo_user = process.env.mongo_user;
        mongo_password = process.env.mongo_password;
    }

    var options = {};
    options.server.socketOptions = { keepAlive: 1 };
    var mongodb = "mongodb://" + mongo_user + ":" + mongo_password + "@mg-mongo.cloudapp.net:27020/awesomezombiesniper";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    
    mongoose.connect(mongodb, op);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback () {
      console.log("We have a connection!");
    });

    var couponSchema = new Schema({
        identifier: String,
        value: Number,
        used: { type: Boolean, default: false}
    });

    couponSchema.statics.findById = function (searchId, cb) {
        this.find({ identifier: searchId }, cb);
    }

    var Coupon = mongoose.model('Coupon', couponSchema);

    // ----------------------------------------------------------------------------------------
    // Simple API
    // ----------------------------------------------------------------------------------------
    app.get(base + 'version', function (req, res) {
        res.send({ version: '1014' })
    });

    // ----------------------------------------------------------------------------------------
    // Credits API
    // ----------------------------------------------------------------------------------------
    
    // Finding Coupon
    app.get(base + 'coupon/find/:identifier', function (req, res) {

        var identifier = req.params.identifier;
        var value;
        var used;

        console.log("Init: Trying to find coupon");



        if (identifier) {
            Coupon.find({ identifier: identifier}, function (error, result) {
                if (error) {
                    console.log("Coupon couldn't be found, error: " + error);
                    res.send({ message: "Error", reason: "Something went wrong." });
                } else if (result.length > 0) {
                    console.log(result);
                    var couponValue = result[0].value;
                    var couponUsed = result[0].used;
                    res.send({ message: "Ok", value: couponValue, used: couponUsed});
                } else {
                    res.send({ message: "Error", reason: "Coupon couldn't be found." });
                }
            })
        } else {
            console.log("Provided parameters insufficient. Provided: " + req.params.couponId);
            res.send({ message: "Error", reason: "Provided parameters insufficient." });
        }

    });

    // Cashing in coupon (marking as 'used')
    app.get(base + 'coupon/consume/:identifier', function (req, res) {

        var identifier = req.params.identifier;
        var value;
        var used;

        console.log("Init: Trying to find coupon");

        if (identifier) {
            Coupon.find({ identifier: identifier}, function (error, result) {
                if (error) {
                    console.log("Coupon couldn't be found, error: " + error);
                    res.send({ message: "Error", reason: "Coupon couldn't be found." });
                } else {
                    console.log(result);
                    Coupon.update(
                        { identifier: identifier },
                        { $set: { used: true }},
                        function (error, numberAffected, raw) {
                            if (error) {
                                console.log("Coupon could not be updated");
                                res.send({ message: "Error", reason: "Coupon could not be updated." });
                            } else {
                                console.log("Update successfull. MongoDB items updated: " + numberAffected);
                                console.log("Raw response was: " + raw);
                                res.send({ message: "Ok", reason: identifier + " consumed"});
                            }
                        }
                    )
                }
            })
        } else {
            console.log("Provided parameters insufficient. Provided: " + req.params.couponId);
            res.send({ message: "Error", reason: "Provided parameters insufficient." });
        }

    });

    // Creating Coupon
    app.get(base + 'coupon/create/:identifier/:value', function (req, res) {
        console.log("Init: Coupon create");

        var identifier = req.params.identifier;
        var value = req.params.value;

        if (identifier && value) {
            var createdCoupon = new Coupon({
                identifier: identifier,
                value: value
            });

            console.log("New coupon created. Id: " + identifier + " Value:" + value);
            console.log("Trying to save new coupon to MongoDB.");

            createdCoupon.save(function (error, createdCoupon) {
                if (error) {
                    console.log("We encountered an error: " + error)
                } else {
                    console.log("Save without error");
                    res.send({ message: "Ok", reason: "Coupon created." });
                }
            });

        } else {
            res.send({ message: "Error", reason: "Provided parameters insufficient." });
        }
    });

    // ----------------------------------------------------------------------------------------
    // Leaderboards API
    // ----------------------------------------------------------------------------------------



}