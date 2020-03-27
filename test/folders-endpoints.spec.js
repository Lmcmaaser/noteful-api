const knex = require('knex')
const fixtures = require('./folders-test-data')
const app = require('../src/app')

describe('Folders Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())
  before('cleanup', () => db('folders').truncate())
  afterEach('cleanup', () => db('folders').truncate())

// unathorized requests
  describe(`Unauthorized requests`, () => {
    const testFolders = fixtures.makeFoldersArray()

    beforeEach('insert folders', () => {
      return db
        .into('folders')
        .insert(testFolders)
    })

    it(`responds with 401 Unauthorized for GET /api/folders`, () => {
      return supertest(app)
        .get('/api/folders')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/folders`, () => {
      return supertest(app)
        .post('/api/folders')
        .send({ title: 'test-title', count: 2 })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/folders/:folder_id`, () => {
      const secondFolder = testFolders[1]
      return supertest(app)
        .get(`/api/folders/${secondFolder.folder_id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/folders/:folder_id`, () => {
      const aFolder = testFolders[1]
      return supertest(app)
        .delete(`/api/notes/${aFolder.folder_id}`) //folderId? id?
        .expect(401, { error: 'Unauthorized request' })
    })
  })

// tests GET
  describe('GET /api/folders', () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/folders')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are folders in the database', () => {
      const testFolders = fixtures.makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('gets the folders from noteful', () => {
        return supertest(app)
          .get('/api/folders')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testFolders)
      })
    })

    context(`Given an XSS attack folders`, () => {
      const { maliciousTest, expectedFolder } = fixtures.makeMaliciousFolder()

      beforeEach('insert malicious folder', () => {
        return db
          .into('folders')
          .insert([maliciousTest])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedFolder.title)
            // add folderId or count?
          })
      })
    })
  })

  describe('GET /api/folders/:folder_id', () => {
    context(`Given no folders`, () => {
      it(`responds 404 when the folder does not exist`, () => {
        return supertest(app)
          .get(`/api/folders/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Folder Not Found` }
          })
      })
    })

    context('Given there are folders in the database', () => {
      const testFolders = fixtures.makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 200 and the specified folder', () => {
        const folderId = 2
        const expectedFolder = testFolders[folderId - 1]
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedFolder)
      })
    })

    context(`Given an XSS attack folder`, () => {
      const { maliciousTest, expectedFolder } = fixtures.makeMaliciousFolder()

      beforeEach('insert malicious folder', () => {
        return db
          .into('folders')
          .insert([maliciousTest])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/folders/${maliciousTest.folder_id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedFolder.title)
          })
      })
    })
  })

  describe('DELETE /api/folders/:folder_id', () => {
    context(`Given no folders`, () => {
      it(`responds 404 when the folder does not exist`, () => {
        return supertest(app)
          .delete(`/api/folders/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Folder Not Found` }
          })
      })
  })

  describe.only(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456
        return supertest(app)
          .patch(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder with that id does not exist` } })
        })
    })
  })

    context('Given there are folders in the database', () => {
      const testFolders = fixtures.makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('removes the folder by id from noteful', () => {
        const idToRemove = 2
        const expectedFolders = testFolders.filter(f => f.id !== idToRemove)
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/folders`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedFolders)
          )
      })
    })
  })

  describe('POST /api/folders', () => {
    it(`responds with 400 missing 'title' if not supplied`, () => {
      const newFolderMissingTitle = {
        // title: 'test-title',
        count: 4, //do I include count? or folderId?
      }
      return supertest(app)
        .post(`/api/folders`)
        .send(newFolderMissingTitle)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'title' is required`)
    })

    it('adds a new folder to noteful', () => {
      const newFolder = {
        title: 'test-title',
        count: 4,
      }
      return supertest(app)
        .post(`/api/folders`)
        .send(newFolder)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('folderId')
          expect(res.body.title).to.eql(newFolder.title)
          expect(res.body.count).to.eql(newFolder.count)
        })
        .then(res =>
          supertest(app)
            .get(`/api/folders/${res.body.folderId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousTest, expectedFolder } = fixtures.makeMaliciousFolder()
      return supertest(app)
        .post(`/api/folders`)
        .send(maliciousTest)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedFolder.title)
          expect(res.body.count).to.eql(expectedFolder.count)
        })
    })
  })
})
