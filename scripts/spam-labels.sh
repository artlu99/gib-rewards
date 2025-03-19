#!/bin/bash

# Store the file path in a variable
LOG_FILE="/Users/art/Documents/warpcast-labels/spam.jsonl"

# Check if an FID argument was provided
if [ $# -eq 0 ]; then
    echo "Please provide an FID number as an argument"
    exit 1
fi

# Store the FID argument
FID=$1

# Run fgrep with the constructed pattern
result=$(fgrep "\"fid\": $FID}" "$LOG_FILE" | head -n 1 | jq '.label_value')

# Print the result
if [ -z "$result" ]; then
    echo -1
else
    echo "$result"
fi
