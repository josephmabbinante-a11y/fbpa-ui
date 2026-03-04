module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(svg|jpg|png|css)$': '<rootDir>/__mocks__/fileMock.js',
  },
};