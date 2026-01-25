module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            useESM: true,
        },
    },
    testRunner: 'jest-circus/runner',
};
