#!/bin/bash

function join_by { local IFS="$1"; shift; echo "$*"; }
mv $1 $(join_by , "$@")
