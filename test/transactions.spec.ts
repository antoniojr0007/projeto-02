import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { app } from '../src/app'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  execSync('npm run knex migrate:rollback --all')
  execSync('npm run knex migrate:latest')
})

it('should be able to create a new transaction', async () => {
  await request(app.server)
    .post('/transactions')
    .send({
      title: 'new transaction',
      amount: 1000,
      type: 'credit',
    })
    .expect(201)
})

it('shoult be albe to list all transactions', async () => {
  const createTransactionResponse = await request(app.server)
    .post('/transactions')
    .send({
      title: 'new transaction',
      amount: 1000,
      type: 'credit',
    })

  const cookies = createTransactionResponse.get('Set-Cookie')

  const listTransactionResponse = await request(app.server)
    .get('/transactions')
    .set('Cookie', cookies)
    .expect(200)

  expect(listTransactionResponse.body.transactions).toEqual([
    expect.objectContaining({
      title: 'new transaction',
      amount: 1000,
    }),
  ])
})

it('shoult be albe to get a specific transaction', async () => {
  const createTransactionResponse = await request(app.server)
    .post('/transactions')
    .send({
      title: 'new transaction',
      amount: 1000,
      type: 'credit',
    })

  const cookies = createTransactionResponse.get('Set-Cookie')

  const listTransactionResponse = await request(app.server)
    .get('/transactions')
    .set('Cookie', cookies)
    .expect(200)

  const transactionId = listTransactionResponse.body.transactions[0].id

  const getTransactionResponse = await request(app.server)
    .get(`/transactions/${transactionId}`)
    .set('Cookie', cookies)
    .expect(200)

  expect(getTransactionResponse.body.transaction).toEqual(
    expect.objectContaining({
      title: 'new transaction',
      amount: 1000,
    }),
  )
})

it('shoult be albe to get the summary', async () => {
  const createTransactionResponse = await request(app.server)
    .post('/transactions')
    .send({
      title: 'credit transaction',
      amount: 3000,
      type: 'credit',
    })

  const cookies = createTransactionResponse.get('Set-Cookie')

  await request(app.server).post('/transactions').set('Cookie', cookies).send({
    title: 'debit transaction',
    amount: 1000,
    type: 'debit',
  })

  const summaryResponse = await request(app.server)
    .get('/transactions/summary')
    .set('Cookie', cookies)
    .expect(200)

  expect(summaryResponse.body.summary).toEqual({
    amount: 2000,
  })
})
