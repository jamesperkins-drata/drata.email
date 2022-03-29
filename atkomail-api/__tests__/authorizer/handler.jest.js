const auth = require('../../src/authorizer/handler');

jest.mock('@okta/jwt-verifier', () => {
  return jest.fn().mockImplementation(() => { // Works and lets you check for constructor calls
    return { verifyAccessToken: (token,aud) => {if(token.startsWith("fail")){throw new Error()} else {return {claims:{sub:'tester',uid:"1234"}}} }};
  });
});

var validEvent= {
  methodArn: 'atest',
  authorizationToken: 'Bearer valid'
}

var invalidEvent= {
  methodArn: 'atest',
  authorizationToken: 'Bearer fail'
}

test('jwt-pass', async ()=>{
  var response = await auth.jwt(validEvent)
  expect(response).toBeDefined()
  expect(response.policyDocument).toBeDefined()
  expect(response.policyDocument.Statement).toBeDefined()
  expect(response.policyDocument.Statement[0].Effect).toBeDefined()
  expect(response.policyDocument.Statement[0].Effect).toMatch(/Allow/)
  expect(response.policyDocument.Statement[0].Resource).toBeDefined()
  expect(response.policyDocument.Statement[0].Resource).toMatch(/atest/)
  expect(response.context).toBeDefined()
  expect(response.context.uid).toBeDefined()
  expect(response.context.uid).toMatch(/1234/)
})

test('jwt-fail', async ()=>{
  var response = await auth.jwt(invalidEvent)
  expect(response).toBeDefined()
  expect(response.policyDocument).toBeDefined()
  expect(response.policyDocument.Statement).toBeDefined()
  expect(response.policyDocument.Statement[0].Effect).toBeDefined()
  expect(response.policyDocument.Statement[0].Effect).toMatch(/Deny/)
  expect(response.policyDocument.Statement[0].Resource).toBeDefined()
  expect(response.policyDocument.Statement[0].Resource).toMatch(/atest/)
})