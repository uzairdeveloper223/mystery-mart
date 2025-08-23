import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "mystery-mart-by-uzair",
        clientEmail: "firebase-adminsdk-fbsvc@mystery-mart-by-uzair.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC56DRWZSviS/Jp\ntRD8NQESypHIj/sf/I9MO+i/7OR473D42BjxEhJCEnF9CCcP9VnJyHcOxdWHl2gN\nt/NFjYe5vmaryZA9TzO2PotIDimLmJYuTcPhhXjrquJj/E9AJpAnTFhMRANTvMUd\n3txI9YiUIIxH4Ha5yHyR22presEIiKoEV0cxbFu2nbvXptUeBcfIrL69Rq3cT9Ip\naaZiKjTBC/eJID4GchRptWWgUfxnEDi8SjZ2bATj38+TRJ4WnieKrrjb5UR9x2Jw\ntuaws0hk+GM6cFsGSlxzXkIgbQ+9WM+yfY6l7ls4wLg3ac6Vc9L9y9hUJBxHwudh\n3IP5+vexAgMBAAECggEAAgvx44+ak5O1d/9zz+r/d4b+YuBe6eO8aiDwt4gynbg5\nHKw4XhMOW2bbk/5Oe8j+M4/+6403BBahISGIzpe3yk4z0ClYaqxgC94VZ3Ysc+p6\noMjfYrC2+5U2h9ZDwxeJl70p7bED/lyCKQmGkFEPr13KXZI1jGcOJAbv3X4M+PyP\nVJp4EWajCbYG7PcFfUPcE70Xd6tWiPlpcmyaf1BfP1htnxx5P1zRFipwc1LEQDig\nxz8ah6YEDzJUAEVxLX/9cWz1NrNqUY8nHA6Q0DC3Sb4pkR0ugRz8+3dtsoYIsb8s\nHSbdd0Pxw8NAGkeX3eKOBEG/TRN1SDTzqUZIanggAQKBgQD7TK0AkCGxvB+HAwjA\nRZqOtyRMVqvfXOrIMf2hWg0Lfxhqb5WuRF/3VY7BxCdLb8YIV3TaB8PehNtHBQLP\nJFU5g5PNbss/7xYFH1wtZ3jt68AcWjBulz4cEgyaQw4HiqxxYyj93UQqFX2kbSmS\nYT1yao561zZt/yNvRFytyS9TsQKBgQC9YmcnoTgOzOBDvFTT/V+R6kQSVJP+HBCe\n3r6K06W+YXe7Y6oDTxZjsYC44OE3zO6lhx1310+6E6i+Rm1Kntfw5W7Ixng280se\nFgmxvnwAis0DL3aF9vH2D+uWfuhyMDymk9E9407Q6LZDUyP5rwG40FoVs0z/1TmB\nnW40qOLkAQKBgQCUQYAvPNkkCmBvPpMDHA069UEs6FUtyZuZ0CRZ9M6NYcX9xScB\nUMVtHcTC+/5SuvaSJUaC+uHLfYYAOCyYGE9PRxkDscGnTl4nV4ECKHFnrBYCpBK+\nq+uwk9VrjPPR7zYdDus4GjoEufkN8Hj+KvAdeE/mmOE7s7IsCqDCxlZtgQKBgEBP\nnTYA8ldcTT/TQX8niH+1bN5IqGTfROmePFhKXPtUf+M7ie1Luw+ppEuj2fcn+VZu\nlpwump1WtbO/mLeBT1U3pDI763DFl5mk5C/evp80gz/0qyv82tezOk5F1EuKg94R\nTjnU6dvZWqNsJUhRnKUU47KAy8IIt1mDi3wIadwBAoGBAMid0ydM+bZ7NJQuNaU7\nFd9tqXkWLfxupINgj72BMAp57UpE1MbH3Qb0xPadEE6e3M1q/r2HYIpgb/OmFVVd\nQWKQFSzeODZpV3s/O8IvTsCtHWqbao/LcqT17JHA9el0zVA5DJ/sDI4KzFIw3I1J\nGmfKpOw4QI03OtWNGPdKLx8o\n-----END PRIVATE KEY-----\n",
      }),
      databaseURL: "https://mystery-mart-by-uzair-default-rtdb.firebaseio.com",
    })
  } catch (error) {
    console.error('Firebase admin initialization error:', error)
  }
}

export default admin