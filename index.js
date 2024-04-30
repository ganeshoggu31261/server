const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const jwt=require('jsonwebtoken');
const {expressjwt: exjwt}=require('express-jwt');
const jwt_decode=require('jwt-decode')



const app=express()

app.use(cors())
app.use(express.json())

secretkey="abcd"
algorithm ="HS256"

const jwtmw=exjwt({
    secret:secretkey,
    algorithms:[algorithm]
})

const client = new MongoClient('mongodb+srv://admin:admin@cluster0.ktnqstp.mongodb.net/?retryWrites=true&w=majority');
client.connect();
const db = client.db('SDP');
const col = db.collection('Registrations');
const bookCol = db.collection('Books');
const ganesh=db.collection('Feedback');
const contact=db.collection('ContactUs');


app.get('/home', (req, res) => {
  res.send('It is a Home Page');
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    const existingUser = await col.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    await col.insertOne({username,email,phoneNumber,password,});
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await col.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/addbooks', async (req, res) => {
  try {
    const { title, author, price, genre, quantity, imageUrl } = req.body; 
    const existingBook = await bookCol.findOne({ title });
    const bookId = () => generateRandomId()
    function generateRandomId() {
      return Math.floor(Math.random() * 900000) + 100000;
  }

    if (existingBook) {
      return res.status(409).json({ error: 'Book already exists' });
    }
    await bookCol.insertOne({ title, author, price, genre, quantity, imageUrl }); 

    res.status(201).json({ message: 'Book added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/addToCart', async (req, res) => {
  try {
    const { book } = req.body;
    const cartCol = db.collection('Cart');
    await cartCol.insertOne(book);
    res.status(201).json({ message: 'Book added to cart successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getbooks', async (req, res) => {
  try {
    const books = await bookCol.find().toArray();
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/deletebook/:_id', async (req, res) => {
  try {
    const bookId = req.params._id;

    // Find the book with the specified ID
    const book = await bookCol.findOne({ "_id": bookId });
    if(book!=null)
    {
      await bookCol.deleteOne({"_id":bookId})
      res.status(200).send("Book Deleted Successfully")
    }
    else
    {
      res.status(200).send("Book Not Found")
    }
  } 
  catch (error)
  {
     res.status(500).send(error.message)
  }  
});

app.get('/retrieve', jwtmw ,async (req,res)=>{
  console.log(jwt_decode.jwtDecode(req.headers.authorization.substring(7)))
  const result= await col.find().toArray()
  console.log(result)
  res.send(result)
})
app.put('/users/:id',async(req,res)=>{
  const{id}=req.params
  const{name,role,email,password}=req.body
  const result= await col.updateOne({_id: new ObjectId(id)},{$set:{name,role,email,password}})
  res.send('updated')
})
app.delete('/users/:id',async (req,res)=>{
  const {id}=req.params
  const result=await col.deleteOne({_id:new ObjectId(id)})
  res.json({message:"deleted successfully"})
});
app.post('/addToCart', async (req, res) => {
  try {
    const { book } = req.body;
    const cartCol = db.collection('Cart');
    await cartCol.insertOne(book);
    res.status(201).json({ message: 'Book added to cart successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getcart', async (req, res) => {
  try {
    const cartCol = db.collection('Cart');
    const cartItems = await cartCol.find().toArray();
    res.status(200).json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.delete('/deletebook', async (req, res) => {
  const bookTitle = req.body.title;

  try {
    // Find and delete the book by title
    const result = await Book.findOneAndDelete({ title: bookTitle });

    if (result) {
      res.status(200).json({ message: `Book "${bookTitle}" deleted successfully` });
    } else {
      res.status(404).json({ error: `Book "${bookTitle}" not found` });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

app.post('/Feedback', async (req, res) => {
  const { feedback, email } = req.body;

  // Here, you can process the feedback data as per your requirements
  // For this example, we'll simply log the feedback to the console
  await ganesh.insertOne({email,feedback});
  console.log('Received feedback:', feedback);
  console.log('Submitted by:', email);

  // Respond with a success message
  res.send('Feedback submitted successfully!');
});
app.post('/Changepassword', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    // Find the user by username
    const user = await col.findOne({ username });

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if the provided old password matches the stored password
    if (user.password !== oldPassword) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    // Update the user's password in the database
    await col.updateOne({ username }, { $set: { password: newPassword } });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const nodemailer = require ("nodemailer")

app.post('/otpsender', (request, response) => {
  const gmailTransporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'yaswanthguntha7@gmail.com',
          pass: 'rohx rnqs cmbp uzxz'
      }
  });

  function generateOTP() {
      return Math.floor(Math.random() * 900000) + 100000;
  }

  const email = 'ganeshoggu04@gmail.com';
  const OTP = generateOTP();
  const otpMap = {};

  const mailOptions = {
      from: 'yaswanthguntha7@gmail.com.com',
      to: email,
      subject: 'Gallery App',
      html: `<p>OTP Verification for Forget Password</p><p>Your OTP is: <strong>${OTP}</strong></p>`
  };

  gmailTransporter.sendMail(mailOptions, function (error, info) {
      if (error) {
          response.status(500).send('Error sending email through Gmail: ' + error.message);
      } else {
          otpMap[email] = OTP;
          response.status(200).json(OTP);
      }
  });
})

app.listen(8081, () => {
  console.log('Server Running on port 8081');
});
