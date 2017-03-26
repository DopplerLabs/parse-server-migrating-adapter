# parse-server-migrating-adapter
[![Coverage Status](https://coveralls.io/repos/github/DopplerLabs/parse-server-migrating-adapter/badge.svg?branch=develop)](https://coveralls.io/github/DopplerLabs/parse-server-migrating-adapter?branch=develop)

[![Build Status](https://travis-ci.org/DopplerLabs/parse-server-migrating-adapter.svg?branch=develop)](https://travis-ci.org/DopplerLabs/parse-server-migrating-adapter)

Parse Server file adapter for migrating between different adapters.

# Quick Start
`$ npm install parse-server-migrating-adapter --save`

In your parse server index:
```
var ParseServer = require('parse-server').ParseServer;
var MigratingAdapter = require('parse-server-migrating-adapter')
var GridStoreAdapter = require('parse-server/lib/Adapters/Files/GridStoreAdapter').GridStoreAdapter
var S3Adapter = require('parse-server-s3-adapter')

var s3Adapter = new S3Adapter({
  bucket: process.env.S3_BUCKET_NAME,
  accessKey: process.env.AWS_ACCESS_KEY,
  secretKey: process.env.AWS_SECRET,
  region: 'us-east-1'
})

var fileAdapter = new MigratingAdapter(s3Adapter, [new GridStoreAdapter(process.env.DATABASE_URI)])

var api = new new ParseServer({
  filesAdapter: fileAdapter
})
```

# Implementation
The adapter takes a main adapter, which is what is used to create any new files. It also takes a list of old adapters. When requesting a file, the main adapter is searched first, and then the old adapters are searched. If the file is found in an old adapter, it is stored on the main adapter.

# Contributing
This projects follows [standardjs](https://standardjs.com/). We also try to maintain 100% real test coverage. When submitting a PR, make sure that there is an accompanying test, and that `npm run build` is clean.

# TODO
* Support for file streaming
