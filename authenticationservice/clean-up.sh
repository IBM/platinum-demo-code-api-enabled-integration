#!/bin/bash

oc delete builds authentication-1 
oc delete buildconfig authentication
oc delete imagestream authentication
oc delete deployment authentication
oc delete service authentication
oc delete route authentication
