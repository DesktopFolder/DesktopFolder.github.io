#!/bin/bash

/opt/homebrew/bin/tree -if ./draaftpack | grep -E '\./.*\..*' | cut -c 3- > index.txt
