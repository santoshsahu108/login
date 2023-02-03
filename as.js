const express = require("express")
const mongoose = require("mongoose")
var ObjectId = require('mongodb').ObjectID;
const Joi = require("joi")
const nodemailer = require('nodemailer');
const { response } = require("express");
const app = express()
var MongoClient = require('mongodb').MongoClient;
app.use(express.json())
let name
let password
let email
let phone
var url = "mongodb://localhost:27017/";


 
let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sahu.santosh998@gmail.com',
        pass: 'dvrmowaqziyjyfei'
    }
});
 


DBcon()
app.post('/createUser',async(req,res)=>{
    //console.log("hellooo")
    name = req.body.name
    password = req.body.password
    email = req.body.email
    phone = req.body.phone
    console.log(req.body, name,password,email,phone)
    
    const toValidate = {
      name : req.body.name,
      password : req.body.password,
      email : req.body.email,
      phone : req.body.phone
  }
    
  const validateObj =  validateUser(toValidate)
    
  if(validateObj.error)
  {  
      //console.log(response.error.details)
      res.send(validateObj.error.details)
      res.end()
  }
  else
  {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("Company");
     
      dbo.collection("emps").findOne({email : req.body.email}, function(err, out) {
        if (err) throw err;
        if(out){
          console.log("email is present");
          res.send({message : "email is taken"})
        }else{
          const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let token = '';
          for (let i = 0; i < 25; i++) {
              token += characters[Math.floor(Math.random() * characters.length )];
          }
          
              const user = new User({
                name: req.body.name,
                email: req.body.email,
                phone : req.body.phone,
                password: req.body.password,
                confirmationCode: token
              });
              try{
                user.save((err) => {
                  if (err) {
                    res.send({ message: err });
                         return;
                      }
                      else{
                        res.send({
                          message:
                            "User was registered successfully! Please check your email",
                       });
              
                       //mail( user.name,user.confirmationCode)
                      }
                      res.end()
                    
             });
          
              }catch (e) {
                res.status(400).send(e)
            }

        }
        
        db.close();
      });
    });
   


  }
   


      

  
})

app.patch('/updateUser', async(req,res)=>{
    console.log("name ->>>", req.query.id)
    const Ido = req.query.id
    console.log("length Ido_---",Ido.length)
    if(Ido.length != 24){
      res.send({message : "please provide proper id"})
    }
    
    const updates = Object.keys(req.body)
    let toValidate ={}
    updates.forEach((update) => toValidate[update] = req.body[update])
    console.log("toValidate__________",toValidate)
    let validateObj ={}
    validateObj = await validateUserUpdate(toValidate)
    console.log("validateObj____________",validateObj)
    console.log("validateObj.value.email____________",validateObj.value.email)
    
    if(validateObj.error)
    {  
        //console.log(response.error.details)
        res.send(validateObj.error.details)
        res.end()
    }
    else
    {
      console.log("validateObj.value.email_____else__________",validateObj.value.email)
      if(validateObj.value.email){
        MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var dbo = db.db("Company");
         console.log("111_________________",validateObj.value.email)
          dbo.collection("emps").findOne({email : validateObj.value.email},async  function(err, out) {
            if (err) throw err;
            console.log('out::::::::::::::',out)
            if(out){
              console.log("email is present");
              res.send({message : "email is taken, please choose unique email"})
            }else{
              const user = await User.findOne({_id : req.query.id})
              console.log('user:::::::::::::',user)
              updates.forEach((update) => user[update] = req.body[update])
              user.save()
              res.send(user)

            }
          })
        })

      }else{
        const user = await User.findOne({_id : req.query.id})
    
        if (!user) {
            return res.status(404).send("no user found")
        }
    
        updates.forEach((update) => user[update] = req.body[update])
        user.save()
        res.send(user)
        
      }
     
    
 

      
    
    


  }

        


})
app.delete('/deleteUser',async(req,res)=>{
  const Ido = req.query.id
  console.log("length Ido_---",Ido.length)
  if(Ido.length != 24){
    res.send({message : "please provide proper id"})
    
  }
    try{
        User.findOne({_id : req.query.id}, function (error, person){
            if(!person){
                    res.send({message :"no user to delete"})
            }else{
                console.log("This object will get deleted " + person);
                res.send(person)
                person.remove();

            }
           
    
        });
    }
    catch(e){
        res.send(e)
    }
})
app.get('/allUser',async (req,res)=>{
    User.find({}, function(err, users) {
        var userMap = {};
    
        users.forEach(function(user) {
          userMap[user._id] = user;
        });
    
        res.send(userMap);  
      });
})

app.get('/oneUser',async(req,res)=>{
  const Ido = req.query.id
  console.log("length Ido_---",Ido.length)
  if(Ido.length != 24){
    res.send({message : "please provide proper id"})
    
  }
   
      User.findOne({_id : req.query.id}, function(err, userD) {
        if(!userD){
          res.send({message : "no user for this name"})
        }else{
          res.send(userD);
        }
          
      });
      
 
})
app.get('/login',async(req,res)=>{
 
    User.findOne({email: req.body.email}, function (error, person){
        if(!person){
                res.send("no user user found for this email")
        }else{
            if (person.status != "Active") {
                return res.status(401).send({
                  message: "Pending Account. Please Verify Your Email!",
                });
              }else{
                if(person.password == req.body.password){
                    res.send("successfull login")
                }else{
                    res.send("wrong password..!!!!")
                }
              }
        
          

        }
       

    });
    
})
app.get("/confirm/:confirmationCode",
(req, res) => {
  const user = new User();
    User.findOne({
      confirmationCode: req.params.confirmationCode,
    })
      .then((user) => {
        console.log("in conformation code ->>>",user)
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }
  
        user.status = "Active";
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }else{
            res.status(200).send({ message: "you are now verified" });
          }
        });
      })
      .catch((e) => console.log("error", e));
  })


app.listen(8000, () => console.log("listerning to port 8000"))










function DBcon(){
    mongoose.connect('mongodb://localhost/Company');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});
 

}
var Schema = new mongoose.Schema({
    // _id    : String,
    name: String,
    email  : {
     type  : String
    } ,
    password : String,
    phone : String,
    status: {
        type: String, 
        enum: ['Pending', 'Active'],
        default: 'Pending'
      },
      confirmationCode: { 
        type: String, 
        unique: true }

    });
     
    var User = mongoose.model('emp', Schema);

    function mail(name,confirmationCode){
        let mailDetails = {
            from: 'sahu.santosh998@gmail.com',
            to: 'santosh.sahu@graymatrix.com',
            subject: "Please confirm your account",
            html: `<h1>Email Confirmation</h1>
                <h2>Hello ${name}</h2>
                <p>Thank you for signup...Please confirm your email by clicking on the following link</p>
                <a href=http://localhost:8000/confirm/${confirmationCode}> Click here</a>
                </div>`
        };


        mailTransporter.sendMail(mailDetails, function(err, data) {
            if(err) {
                console.log('Error Occurs');
            } else {
                console.log('Email sent successfully');
            }
        });

    }

    function validateUser(user)
{
    const JoiSchema = Joi.object({
      
        name: Joi.string()
                  .min(5)
                  .max(30)
                  .required(),
                    
        email: Joi.string()
               .email()
               .min(5)
               .max(50)
               .required(),

        password: Joi.string()
               .min(5)
               .max(50)
               .required(),

        phone: Joi.string()
               .min(10)
               .max(10)
               .required(),


}).options({ abortEarly: false });

return JoiSchema.validate(user)
}

async function validateUserUpdate(user)
{
    const JoiSchema = Joi.object({
      
        name: Joi.string()
                  .min(5)
                  .max(30)
                  .optional(),
                    
        email: Joi.string()
               .email()
               .min(5)
               .max(50)
               .optional(),

        password: Joi.string()
               .min(5)
               .max(50)
               .optional(),

        phone: Joi.string()
               .min(10)
               .max(10)
               .optional(),


}).options({ abortEarly: false });

return JoiSchema.validate(user)
}


async function validateID(o_id){
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("Company");
    console.log("o_id--_________-------------",o_id)
    dbo.collection("emps").findOne({"_id" : new ObjectId(o_id)}, function(err, result) {
      if (err) throw err;
      if (result){
        return true
      }else{
        return false
      }
      db.close();
    });
  });
}