const { expect } = require('chai')
const supertest = require('supertest')
const app = require('../src/app')

describe('App', () => {
  it('GET / responds with 200 "Hello, world!"', () => {
    const token = `bearer ` + process.env.API_TOKEN;
    return supertest(app)
      .get('/')
      .set('Authorization', token)
      .expect(200, 'Hello, world!')
  })
})
