import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getRegistrationErrors, getLoginErrors } from '../utils/authValidation.js'

const valid = { name: 'Test User', email: 'testuser@gmail.com', password: 'Pass123!', confirmPassword: 'Pass123!' }

test('confirmation rejects mismatches and recovers after correction', () => {
  assert.equal(getRegistrationErrors({ ...valid, confirmPassword: 'different!' }).confirmPassword, 'Passwords must match.')
  assert.deepEqual(getRegistrationErrors(valid), {})
})

test('password length boundaries and special character types are validated consistently', () => {
  assert.ok(getRegistrationErrors({ ...valid, password: 'Abc123!' }).password)
  assert.equal(getRegistrationErrors(valid).password, undefined)
  const longest = 'A'.repeat(127) + '!'
  assert.deepEqual(getRegistrationErrors({ ...valid, password: longest, confirmPassword: longest }), {})
  assert.ok(getRegistrationErrors({ ...valid, password: longest + 'a' }).password)
  for (const special of ['!', '@', '#', '$', '%', '-', '_']) {
    const password = `Abc1234${special}`
    assert.equal(getRegistrationErrors({ ...valid, password, confirmPassword: password }).password, undefined)
  }
})

test('legacy login does not reapply new registration password strength or Gmail rules', () => {
  assert.deepEqual(getLoginErrors({ email: 'old@example.com', password: 'oldpass' }), {})
  assert.ok(getRegistrationErrors({ ...valid, email: 'old@example.com', password: 'oldpass' }).email)
  assert.ok(getLoginErrors({ email: valid.email, password: '' }).password)
})
