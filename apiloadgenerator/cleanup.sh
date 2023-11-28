#!/bin/bash

oc delete builds apiloadgenerator-1
oc delete buildconfig apiloadgenerator
oc delete imagestream apiloadgenerator
oc delete deployment apiloadgenerator
