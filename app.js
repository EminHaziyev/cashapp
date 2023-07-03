const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const MongoDBSession = require("connect-mongodb-session")(session);

const app = express();
app.set('view engine', 'ejs');
mongoose.connect("mongodb://127.0.0.1:27017/yourcashDB" , {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}))

app.use(express.static("public"));

const store = new MongoDBSession({
    uri: "mongodb://127.0.0.1:27017/sessions",
    collection: "mySessions"
});

app.use(session({
    secret: "klj3haa4dfs9dklasdfj143210H3KSJDhasdfKALJSd832",
    resave: false,
    saveUninitialized: false,
    store: store
}));

const UserSchema = {
    username: String,
    password: String,
    total: {
        type: Number,
        default: 0.00,
        float: true
    },
    processes: [
    {
        time: {
            type: String,
            required: false
        },
        amount: {
            type: Number,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        source: {
            type: String,
            required: false
        }
    }
    ]
};

const User = mongoose.model("User" , UserSchema );










const requireLogin = (req, res, next) => {
    if (req.session.userId) {
      
      next();
    } else {
      res.redirect("/login");
    }
};

app.get("/signup" , (req,res) => {
    res.render("signup"); 
});


app.post("/createacc" , (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const newUser = new User({
        username: username,
        password: password,
        
    });
    newUser.save()
    .then(savedUser => {
        req.session.userId = savedUser._id;
        req.session.username = savedUser.username;

        res.redirect("/login");
    })
    .catch(err => {
        console.log(err);
        res.redirect("/signup");
    });

});




app.get("/login", (req,res) => {
    res.render("login");

});

app.post("/loginacc", async (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await User.findOne({username: username});
    if(password === user.password){
        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect("/dashboard");
    }
    else{
        res.redirect("/login");

    }
});


// const user = await User.findOneAndUpdate(
//     { _id: req.session.userId },
//     { $push: { processes: { amount, type, time } } },
//     { new: true }
// );


app.get("/dashboard", requireLogin, async (req, res) => {
    const user = await User.findOne({username: req.session.username});

    const total = parseFloat(user.total);
    
    res.render("dashboard" , {username: req.session.username, processes: user.processes.slice(-2).reverse(), totalMoney: total})
});
  
app.get("/addprocess" , (req,res) => {
    res.render("addprocess");
});

app.post("/add_process" ,  async (req,res) => {
    console.log("test");
    const currentDate = new Date();
    const fullDate = currentDate.toLocaleString();

    const amount = parseFloat(req.body.amount);
    const type = req.body.type;
    console.log(amount, type);
    const newProcess = {
        time: fullDate,
        amount: amount,
        type: type
    };

    const user = await User.findOne({_id: req.session.userId});
    const total = parseFloat(user.total);
    try {
        
        if(type ==="income"){
            const lastTotal = total + amount;
            const updatedUser = await User.findOneAndUpdate(
                { _id: req.session.userId },
                { total: lastTotal},
                { new: true }
            );
            const updatedUser1 = await User.findOneAndUpdate(
                { _id: req.session.userId },
                { $push: { processes: newProcess } },
                { new: true }
              );
        };
        if(type ==="outcome"){
            const lastTotal = total - amount;
            if(lastTotal >= 0){
                const updatedUser = await User.findOneAndUpdate(
                    { _id: req.session.userId },
                    { total: lastTotal},
                    { new: true }
                );
                const updatedUser1 = await User.findOneAndUpdate(
                    { _id: req.session.userId },
                    { $push: { processes: newProcess } },
                    { new: true }
                  );
            }
            else{
                console.log("menfidir");
            }
            
        }
        console.log(updatedUser); // Updated user object
    
        res.redirect("/dashboard");
      } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
      }

    
});

app.get("/allprocesses" , requireLogin , async (req,res) => {
    const user = await User.findOne({_id: req.session.userId});
    console.log(user.processes);
    res.render("allprocesses" , {processes: user.processes , username: user.username});
})




app.listen("3000" , () => {
    console.log("server started at port 3000");
})