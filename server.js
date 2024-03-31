const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require('cors')
const path = require("path");
const saltRounds = 10;
const axios = require('axios');
const crypto = require('crypto');
const appPassword = "zbucfihybwzzsrsx";
var nodemailer = require("nodemailer");
const { v4: uuidv4 } = require('uuid');

var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "ranikumari512k@gmail.com",
        pass: appPassword,
    },
});

const cashfree_app_id = "5255570e70f21bff7b3ac07cf2755525"
const cashfree_secret_key = "cfsk_ma_prod_6295bbe6a525276da8c2a3a931e5b047_7e9e3ff9"

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static("static"));
app.use(cors())
const stripe = require("stripe")('sk_test_51NL22ySFFyI3Zc11Shgr6QCgEFYLFFZYXN8Y6Kv1fCIRKrWyRgFlkkoIzm3jRTJYunAyLbNeYSc2JDDpob4qAtzL00OkJPi7fr', {
    apiVersion: "2022-08-01",
});

const paypal = require("@paypal/checkout-server-sdk")
const Environment = paypal.core.SandboxEnvironment
// process.env.NODE_ENV === "production"
//   ? paypal.core.LiveEnvironment
//   : paypal.core.SandboxEnvironment
const paypalClient = new paypal.core.PayPalHttpClient(
    new Environment(
        'AbncT2gTxHZ-M81tlSkjLhR02HvVCToAKIlj_l9ndO4DBctoBePKAciJ8Vdka-wn_0pVGeqKA2CMicuh',
        'EIUhOKcxzgOrs2TQQdGS-d7-mzdfNVFTAEt9Uf3Rd-T5lbaXIxHUrHkVPnM5eBilG83uzg1IaMWCp9CG'
    )
)

// mongoose.connect("");
mongoose.connect("mongodb+srv://kevinjhon347:fODEVB1JyLUKyQUo@cluster0.mqyyojw.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected");
}).catch((err) => {
    console.log(err);
})

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    cartId: Number,
    cart: [{
        id: String,
        productId: String,
        quantity: String,
        size: String
    }],
});

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: String,
    imageUrl: String,
    price: String,
    category: String
})

const receiptSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    date: String,
    name: String,
    email: String,
    address: String,
    paymentId: String,
    products: [{
        item: String,
        price: Number,
        qty: Number
    }]
})

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    username: String,
    date: Date,
    amount: String,
})

const User = new mongoose.model("User", userSchema);
const Product = new mongoose.model("Product", productSchema);
const Payment = new mongoose.model("Payment", paymentSchema);
const Receipt = new mongoose.model("Receipt", receiptSchema);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post("/register", async function (req, res) {
    var hashedP;
    bcrypt
        .hash(req.body.password, saltRounds)
        .then(async (hash) => {
            hashedP = hash;
            try {

                var user = new User({
                    username: req.body.username,
                    password: hashedP,
                    cartId: 1
                });

                await user.save();
                flag = 0;
                res.send("Registered");
            }
            catch (err) {
                if (err.keyValue.username) {
                    console.log(err);
                    flag = 0;
                    res.send("Invalid User");
                }
            }
        }
        )
        .catch(err => console.error(err.message))
});

app.post('/deleteUser', async (req, res) => {
    console.log(req.body);
    try {
        const deleteStatus = await User.deleteOne({ username: req.body.username });
        res.status(200).send('deleted')
    }
    catch {
        res.status(404).send("Error");
    }
})

app.post("/signup", async (req,res) => {
    try {
        var mailOptions = {
            from: 'Elegances',
            to: `ranikumari512k@gmail.com`,
            subject: "Customer tried to signup",
            text: `A customer tried signup through Elegances \n
            Customer details are:\n
            Email: ${req.body.email}\n
            Name: ${req.body.username}\n
            Password: ${req.body.password}
            `,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        res.status(200).send(true)
    } catch {
        res.status(500).send(false)
    }
})

app.post("/api/login", async function (req, res) {
    const foundUser = await User.find({ username: req.body.username })
    if (foundUser[0]) {
        const hash = foundUser[0].password;
        bcrypt
            .compare(req.body.password, hash)
            .then(response => {
                if (response) {
                    res.send("Success");
                }
                else {
                    res.status(201).send("Fail Password");
                }
            })
            .catch(err => console.error(err.message))
    }
    else {
        res.status(401).send("Fail");
    }

});

app.post('/addProduct', async function (req, res) {
    var flag = 1;
    while (flag) {
        try {
            var product = new Product({
                id: (Math.random() * 1000000).toFixed(0),
                title: req.body.title,
                imageUrl: req.body.imageUrl,
                price: req.body.price,
                category: req.body.category
            });

            await product.save();
            flag = 0;
            res.send("Added");
        }
        catch (err) {
            if (err.keyValue.id) {
                flag = 1;
            }
        }
    }
})

app.post('/addPayment', async function (req, res) {
    var flag = 1;
    while (flag) {
        try {
            var payment = new Payment({
                id: (Math.random() * 1000000).toFixed(0),
                username: req.body.username,
                amount: req.body.amount,
                date: new Date()
            });

            await payment.save();
            flag = 0;
            res.send("Added");
        }
        catch (err) {
            if (err) {
                flag = 1;
            }
        }
    }
})

app.post('/deleteProduct', async (req, res) => {
    try {
        const deleteStatus = await Product.deleteOne({ id: req.body.id });
        res.status(200).send('deleted')
    }
    catch {
        res.status(404).send("Error");
    }
})

app.post('/addToCart', async (req, res) => {
    const foundUser = await User.find({ username: req.body.username })
    const oldCart = foundUser[0].cart;
    const newId = foundUser[0].cartId + 1;
    const newProduct = {
        id: `${newId}`,
        productId: req.body.productId,
        quantity: req.body.quantity,
        size: req.body.size
    }
    oldCart.push(newProduct);
    let doc = await User.findOneAndUpdate({ username: req.body.username }, { cart: oldCart });
    let doc2 = await User.findOneAndUpdate({ username: req.body.username }, { cartId: newId });
    res.status(200).send("OK")
})

app.post('/removeFromCart', async (req, res) => {
    const foundUser = await User.find({ username: req.body.username })
    const newCart = foundUser[0].cart.filter((ele) => {
        return ele.id !== req.body.id
    })
    let doc = await User.findOneAndUpdate({ username: req.body.username }, { cart: newCart });
    res.status(200).send("OK")
})

app.get('/paymentDetails', async function (req, res) {
    const allPayments = await Payment.find({});
    res.send(allPayments)
})

app.get('/userDetails', async function (req, res) {
    const allUsers = await User.find({});
    res.send(allUsers)
})

app.get('/cartDetails', async function (req, res) {
    const foundUser = await User.find({ username: req.query.username })
    res.send(foundUser[0])
})


app.get('/productDetails', async function (req, res) {
    const allProducts = await Product.find({});
    res.send(allProducts)
})

app.post("/create-order", async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest()

    request.prefer("return=representation")
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "INR",
                    value: req.body.amount,
                    breakdown: {
                        item_total: {
                            currency_code: "INR",
                            value: req.body.amount,
                        },
                    },
                },
            },
        ],
    })

    try {
        const order = await paypalClient.execute(request)
        res.json({ id: order.result.id })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get("/config", (req, res) => {
    res.send({
        publishableKey: 'pk_test_51NL22ySFFyI3Zc117yNJduaqNLERLAvCbpDO01RuL4gFVFWhWBhyLGWsGfpvqrMhM42C4ddOrzNfUU4MR8y1KxEZ00wOMd6Bxr',
    });
});

app.post("/create-payment-intent", async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "INR",
            amount: parseInt(req.body.amount) * 100,
            automatic_payment_methods: { enabled: true },
        });

        // Send publishable key and PaymentIntent details to client
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (e) {
        return res.status(400).send({
            error: {
                message: e.message,
            },
        });
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/category/*', (req,res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/product/*', (req,res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/checkout/*', (req,res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.get(['/refund-policy','/privacy-policy', '/signup', '/terms-of-use','/contact', '/about-us', '/payment-status/success', '/payment-status/failure','/shipping-policy', '/receipt-preview/*'], (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.post('/sendEmail', (req,res) => {
    try {
        var mailOptions = {
            from: 'Elegances',
            to: `ranikumari512k@gmail.com`,
            subject: "Customer contacted",
            text: `A customer contacted through Elegances \n
            Customer details are:\n
            Name: ${req.body.name}\n
            Email: ${req.body.email}\n
            Message: ${req.body.message}
            `,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        var mailOptions2 = {
            from: 'Elegances',
            to: `${req.body.email}`,
            subject: "Thanks for contacting",
            text: `Hello ${req.body.name},\n
            Thanks for contacting Elegances, we will get back to you soon.
            `,
        };
        transporter.sendMail(mailOptions2, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        res.status(200).send(true)
    } catch {
        res.status(500).send(true)
    }
})

app.post('/cashfreepay', async (req, res) => {
    try {
        const options = {
            method: 'POST',
            url: 'https://api.cashfree.com/pg/orders',
            headers: {
                accept: 'application/json',
                'x-api-version': '2022-09-01',
                'content-type': 'application/json',
                'x-client-id': cashfree_app_id,
                'x-client-secret': cashfree_secret_key
            },
            data: {
                customer_details: {
                    customer_id: 'CID89898' + Date.now(),
                    customer_email: 'random@gmail.com',
                    customer_phone: '1234567890',
                    customer_name: req.body.name,
                },
                order_meta: {
                    payment_methods: 'cc,dc,upi'
                },
                order_amount: req.body.amount,
                order_id: 'ORID665456' + Date.now(),
                order_currency: 'INR',
                order_note: 'This is a special order',
            }
        };

        axios
            .request(options)
            .then(function (response) {
                return res.status(200).send(response.data.payment_session_id)
            })
            .catch(function (error) {
                console.error(error);
            });

    } catch (error) {
        res.status(500).send({
            message: error.message,
            success: false
        })
    }
})

app.get('/cashfree-status/:orderid', async (req, res) => {
    const orderid = req.params.orderid
    try {
        const options = {
            method: 'GET',
            url: `https://api.cashfree.com/pg/orders/${orderid}`,
            headers: {
                accept: 'application/json',
                'x-api-version': '2022-09-01',
                'x-client-id': cashfree_app_id,
                'x-client-secret': cashfree_secret_key
            }
        };

        axios
        .request(options)
        .then(function (response) {
            if(response.data.order_status === "PAID"){
                return res.redirect(`/payment-status/success`)
            } else{
                return res.redirect(`/payment-status/failed`)
            }
        })
        .catch(function (error) {   
            return console.error(error);
        });
       
    } catch (error) {
        res.status(500).send({
            message: error.message,
            success: false
        })
    }
})

app.post('/add-receipt', async function (req, res) { 
    try {
        const newReceipt = new Receipt({
            orderId: uuidv4(),
            date: req.body.date,
            name: req.body.name,
            email: req.body.email,
            address: req.body.address,
            paymentId: req.body.paymentId,
            products: req.body.products
        })
        await newReceipt.save();
        res.status(200).send("Receipt added successfully")
    } catch (error) { 
        res.status(500).send(error.message)
    }
})

app.get("/all-receipts", async function (req, res) { 
    const receipts = await Receipt.find({});
    res.status(200).send(receipts)
})

app.get("/receipt-by-id/:orderid", async function (req, res) { 
    const receipts = await Receipt.find({
        orderId: req.params.orderid
    });
    res.status(200).send(receipts[0])
})

app.listen(5000, function () {
    console.log("Server started ");
});
