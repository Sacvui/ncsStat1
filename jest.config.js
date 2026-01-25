export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
};
preset: 'ts-jest',
    testEnvironment: 'jsdom',
        moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    },
transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    },
globals: {
    'ts-jest': {
        tsconfig: 'tsconfig.json',
        },
},
};
