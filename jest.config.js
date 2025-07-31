const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
  ],
  moduleNameMapper: {
    // 单独映射 firebase
    '^@modules/firebase$': '<rootDir>/src/modules/firebase.ts',
    // 其它 @modules/xxx
    ...pathsToModuleNameMapper(
        compilerOptions.paths || {},
        { prefix: '<rootDir>/src/' }
    ),
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)']
};