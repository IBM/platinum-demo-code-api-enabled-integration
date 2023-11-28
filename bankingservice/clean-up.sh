#!/bin/bash

oc delete builds banking-1 
oc delete buildconfig banking
oc delete imagestream banking
oc delete deployment banking
oc delete service banking
