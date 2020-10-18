/* eslint-env node */

module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "bootbox": "readonly",
        "Phaser": "readonly",
        "JitsiMeetJS": "readonly",
    },
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "max-len": [
            "error",
            {
                "code": 80,
                "tabWidth": 2,
            }
        ]
    }
};
