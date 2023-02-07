const express = require("express")

const app = express()
app.use(express.json())

const fetch = require("node-fetch");
const mongoose = require("mongoose")
const Joi = require("joi")
const nodemailer = require('nodemailer');
const { response } = require("express");
var MongoClient = require('mongodb').MongoClient;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

var err = {};
let deptName
let name
let password
let email
let phone
var url = "mongodb://localhost:27017/";
const users = []




 
let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sahu.santosh998@gmail.com',
        pass: 'dvrmowaqziyjyfei'
    }
});
 


DBcon()


app.post('/createDept', async(req,res)=>{
  const dept = new Dept({
    deptName: req.body.deptName,

  })
  dept.save((err) => {
    if (err) {
      res.send({ message: err });
           return;
        }
        else{
          res.send({
            message:
              "Department was registered successfully",
         });
        }
        res.end()
      
})

})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

  app.post('/createUser',async (req,res)=>{
    //console.log("hellooo")
    let present
    name = req.body.name
    password = req.body.password
    email = req.body.email
    phone = req.body.phone
    deptName = req.body.deptName
    console.log(req.body, name,password,email,phone)
    
    const toValidate = {
      name : req.body.name,
      password : req.body.password,
      email : req.body.email,
      phone : req.body.phone,
      deptName : req.body.deptName
  }
 
    
  const validateObj =  validateUser(toValidate)
    
  if(validateObj.error)
  {  
      console.log("errrrrrrrrrrr",JSON.stringify(validateObj.error.details[0]))

    
      res.send(JSON.stringify(validateObj.error.details[0]))
      res.end()
  }
  else
  {
    const out = await Dept.findOne({deptName : req.body.deptName})
    console.log("out>.........>>>>>",out)
    //process.exit()

    if (out){
        present = out.deptName
    

     const out1 = await User.findOne({email : req.body.email})

    if(out1){
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
                deptName : req.body.deptName,
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
                            deptName : out.deptName
                    });
              
                       //mail( user.name,user.confirmationCode)
                  }
                     
                });
          
          }
          catch (e) {
                res.status(400).send(e)
              }

          }
      
    }
    else{
      res.send({deptName : "provide the proper department"})
    }
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
        // var userMap = {};
        console.log("users in all users_-_",users)
    
        // users.forEach(function(user) {
        //   userMap[user._id] = user;
        // });
    
        res.send(users);  
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

  io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    socket.on('join', (department, callback) => {
    // const { error, user } = addUser({ id: socket.id, ...options })
    var myKey = "id";
    var myValue = socket.id;

    // Dynamically adding a key/value pair
    department[myKey] = myValue;
    console.log("depatment before pushing into array",department)
      users.push(department)
    // console.log("department---",department)
    socket.join(department.deptName)

    socket.emit('message', { message : `welcome ${department.name} to ${department.deptName} department`})
    socket.broadcast.to(department.deptName).emit('message', { message : `new user - ${department.name}  added in ${department.deptName}  department ........`})
    // io.to(department).emit('roomData', {
    //     room: user.room,
    //     users: getUsersInRoom(user.room)
    // })

    // callback()
    })
    socket.on('sendMessage', (message, callback) => {
      console.log("_______socket----id-----",socket.id)
      console.log("_______message----",message)
      const user = getUser(socket.id)
      console.log('useeeeeeeeeeeeer----', user)
      console.log("))))))user.room---",user.deptName)

      // io.to(user.room).emit('message', generateMessage(user.username, message))
      io.to(user.deptName).emit('textMessage',`${user.name} : ${message}` )
      callback()
  })

  })

// io.sockets.on('connection', function(socket) {
//   socket.on('create', function(room) {
//     socket.join(room);
//     console.log("joined to room _-----",room)
//   });
// });

// io.on('connection', async (socket) => {

//   console.log('a user connected');
//   socket.on('chat message', (msg) => {
//     console.log('message: ' +msg);
//     fetch("http://localhost:8000/createUser", {
//       method: 'POST',
//       headers:{
//           'Content-Type':'application/json'
//       },
//       body: msg
//   })
//   .then((res) => {console.log("response for fetch_-___-----",res)})
//   .catch((err) => console.log("the error is ",err));
    
//   });
//   // setInterval( async function(){
//   var response =await fetch("http://localhost:8000/allUser")
// 			var userData = await response.json()
//       var sendData = JSON.stringify(Object.values(userData))
//     console.log("response for fetch_-___-----",sendData)
//     io.sockets.emit('broadcast',sendData);
//   // },1000)

  
  
 

  
// });


server.listen(8000, () => console.log("listerning to port 8000"))










function DBcon(){
    mongoose.connect('mongodb://localhost/Company');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});
 

}
var deptSchema = new mongoose.Schema({
  deptName : String
});
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
        unique: true },
        deptName : String


    });
    var Dept  = mongoose.model('Dept', deptSchema);
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

        deptName : Joi.string()
                .min(7)
               .max(11)
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


const getUser = (id) => {

  //console.log("after pushing into the array--", users)
  return users.find((user) => user.id === id)
}