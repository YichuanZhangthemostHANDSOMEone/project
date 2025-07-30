// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
  ],
  moduleNameMapper: {
    // 这一行必须用 baseUrl: "src"
    ...pathsToModuleNameMapper(
        compilerOptions.paths || {},
        { prefix: '<rootDir>/src/' }
    ),
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)']
};