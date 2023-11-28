#!/bin/bash

oc delete builds aggregator-1 
oc delete buildconfig aggregator
oc delete imagestream aggregator
oc delete deployment aggregator
oc delete service aggregator
oc delete route aggregator
