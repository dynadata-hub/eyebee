#!/bin/bash
docker run --rm -v $(pwd):/src -w /src node:14.16.0-alpine npm install