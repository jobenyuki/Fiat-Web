module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^Components(.*)$': '<rootDir>/src/components$1',
    '^Hooks(.*)$': '<rootDir>/src/hooks$1',
    '^Utils(.*)$': '<rootDir>/src/utils$1',
    '^Assets(.*)$': '<rootDir>/src/assets$1',
    '^Configs(.*)$': '<rootDir>/src/configs$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
    '^.+\\.scss$': 'identity-obj-proxy',
  },
}
