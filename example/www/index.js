import express from 'express'
import { faker } from '@faker-js/faker';

const app = express()
const port = 3456

const db = {
  products: {},
  sellers: {}
}
db.sellers = Array(5).fill(0).map(() => ({
  id: faker.database.mongodbObjectId(),
  name: faker.company.name(),
  location: faker.location.street(),
  phone: faker.phone.number()
}))
db.products = Array(100).fill(0).map(() => ({
  id: faker.database.mongodbObjectId(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: faker.commerce.price(),
  stock: faker.number.int({min:0, max: 100}),
  seller: db.sellers[Math.floor(Math.random()*db.sellers.length)]
}))

console.log(JSON.stringify(db, null, 2))

app.get('/', (req, res) => {
  let content = '<h1>Welcome to the Store!</h1><ul>'
  content += db.products.map(product => (`
    <li>
      <a href="/product/${product.id}">${product.name}</a>
    </li>
  `)).join('')
  content += '</ul>'
  res.send(content)
})

app.get('/product/:id', (req, res) => {

  if(Math.random() > 0.9) {
    return res.status(500).send('Oops! Not this time!')
  }

  const product = db.products.find(p => p.id === req.params.id)
  if (req.params.id === 'err_empty') {
    return res.send(`<h1>Empty item</h1>`)
  }
  if(!product) {
    return res.status(404).send("404 Not Found")
  }
  let content = `<h1>${product.name}</h1>
    <ul>
      <li><strong>Name:</strong> ${product.name}</li>
      <li><strong>Description:</strong> ${product.description}</li>
      <li><strong>Price:</strong> ${product.price}</li>
      <li><strong>Stock:</strong> ${product.stock}</li>
      <li><strong>Seller:</strong> <a href="/seller/${product.seller.id}">${product.seller.name}</a></li>
    </ul>
  `
  
  setTimeout(() => res.send(content), 100)
})

app.get('/seller/:id', (req, res) => {
  const seller = db.sellers.find(s => s.id === req.params.id)
  let content = `<h1>${seller.name}</h1>
    <ul>
      <li><strong>Name:</strong> ${seller.name}</li>
      <li><strong>Location:</strong> ${seller.location}</li>
      <li><strong>Phone:</strong> ${seller.phone}</li>
    </ul>
  `
  res.send(content)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})